"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type CharacterBuild,
  type EquipmentChoice,
  type InventoryItem,
  type PhbGearCategory,
  PHB_GEAR_CATALOG,
  canAffordCost,
  formatCostCp,
  formatPurseGpEquivalent,
  getBackgroundEquipment,
  purchaseGearItem,
  removePurchasedGear,
  updateEquipmentChoice,
} from "~/lib/character";
import { backgrounds } from "~/lib/chronicle/chronicle";

import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

type EquipmentStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

const CATEGORY_LABELS: Record<PhbGearCategory | "all", string> = {
  all: "Все",
  gear: "Снаряжение",
  tool: "Инструменты",
  pack: "Наборы",
  other: "Прочее",
};

const COIN_FIELDS = [
  { key: "cp" as const, label: "ММ" },
  { key: "sp" as const, label: "СМ" },
  { key: "ep" as const, label: "ЭМ" },
  { key: "gp" as const, label: "ЗМ" },
  { key: "pp" as const, label: "ПМ" },
];

function totalInventoryWeight(items: InventoryItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.weightLb * item.quantity,
    0,
  );
}

function formatWeightLb(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

function inventoryItemKey(item: InventoryItem, index: number): string {
  return `${item.source}-${item.catalogId ?? item.nameRu}-${index}`;
}

function ChoiceOption({
  checked,
  label,
  name,
  value,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: string;
  value: EquipmentChoice;
  onChange: (value: EquipmentChoice) => void;
}) {
  return (
    <label
      className={[
        wizardTheme.selectCard.base,
        "cursor-pointer items-center justify-between",
        checked ? wizardTheme.selectCard.selected : wizardTheme.selectCard.unselected,
      ].join(" ")}
    >
      <span className="text-sm font-medium text-stone-100">{label}</span>
      <input
        checked={checked}
        className="accent-amber-400"
        name={name}
        type="radio"
        value={value}
        onChange={() => onChange(value)}
      />
    </label>
  );
}

function CoinPurseDisplay({ build }: { build: CharacterBuild }) {
  const gpEquivalent = formatPurseGpEquivalent(build.coins);

  return (
    <section className={wizardTheme.detailPanel}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className={wizardTheme.sectionLabel}>Кошелёк</h3>
        <p className="text-sm text-stone-400">
          Всего:{" "}
          <span className="font-semibold text-amber-200">{gpEquivalent} зм</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {COIN_FIELDS.map(({ key, label }) => (
          <div
            className="flex flex-col items-center rounded-lg border border-stone-700/80 bg-black/40 px-2 py-2"
            key={key}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              {label}
            </span>
            <span className="mt-1 text-lg font-bold tabular-nums text-stone-100">
              {build.coins[key]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function InventoryList({
  items,
  onRemoveShopItem,
}: {
  items: InventoryItem[];
  onRemoveShopItem?: (catalogId: string) => void;
}) {
  const totalWeight = totalInventoryWeight(items);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className={wizardTheme.sectionLabel}>Инвентарь</h3>
        <p className="text-sm text-stone-500">
          Общий вес:{" "}
          <span className="font-medium text-stone-300">
            {formatWeightLb(totalWeight)} фн
          </span>
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2 rounded-xl border border-stone-700/80 bg-black/40 px-4 py-3">
          {items.map((item, index) => {
            const canRemove =
              item.source === "shop" &&
              item.catalogId &&
              onRemoveShopItem !== undefined;

            return (
              <li
                className="flex items-start justify-between gap-3 text-sm leading-6 text-stone-200"
                key={inventoryItemKey(item, index)}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400"
                  />
                  <span className="min-w-0">
                    {item.quantity > 1
                      ? `${item.nameRu} (×${item.quantity})`
                      : item.nameRu}
                    {item.source === "shop" ? (
                      <span className="ml-2 text-xs text-amber-400/80">
                        магазин
                      </span>
                    ) : null}
                  </span>
                  {canRemove ? (
                    <button
                      aria-label={`Удалить ${item.nameRu}`}
                      className="mt-0.5 shrink-0 cursor-pointer rounded-md border border-stone-600/80 px-2 py-0.5 text-xs font-semibold leading-none text-stone-400 transition hover:border-red-500/60 hover:bg-red-950/40 hover:text-red-200"
                      type="button"
                      onClick={() => onRemoveShopItem(item.catalogId!)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                {item.weightLb > 0 ? (
                  <span className="shrink-0 tabular-nums text-stone-500">
                    {formatWeightLb(item.weightLb * item.quantity)} фн
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={wizardTheme.detailPlaceholder}>Инвентарь пуст.</p>
      )}
    </section>
  );
}

export function EquipmentStep({ build, onChange }: EquipmentStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PhbGearCategory | "all">(
    "all",
  );

  const selectedBackground = useMemo(
    () => backgrounds.find((entry) => entry.id === build.backgroundId) ?? null,
    [build.backgroundId],
  );

  const pack = useMemo(
    () =>
      build.backgroundId
        ? getBackgroundEquipment(build.backgroundId)
        : { items: [] as string[] },
    [build.backgroundId],
  );

  const hasGoldAlternative =
    pack.goldAlternativeGp !== undefined && pack.goldAlternativeGp > 0;

  const handleChoiceChange = useCallback(
    (choice: EquipmentChoice) => {
      if (build.equipmentChoice === choice) {
        return;
      }

      onChange(updateEquipmentChoice(build, choice));
    },
    [build, onChange],
  );

  const handlePurchase = useCallback(
    (catalogId: string) => {
      onChange(purchaseGearItem(build, catalogId));
    },
    [build, onChange],
  );

  const handleRemovePurchase = useCallback(
    (catalogId: string) => {
      onChange(removePurchasedGear(build, catalogId));
    },
    [build, onChange],
  );

  useEffect(() => {
    if (
      !hasGoldAlternative &&
      !build.equipmentChoice &&
      build.backgroundId &&
      pack.items.length > 0
    ) {
      onChange(updateEquipmentChoice(build, "equipment"));
    }
  }, [
    build,
    hasGoldAlternative,
    onChange,
    pack.items.length,
  ]);

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return PHB_GEAR_CATALOG.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return item.nameRu.toLowerCase().includes(normalizedQuery);
    });
  }, [categoryFilter, searchQuery]);

  if (!build.backgroundId) {
    return (
      <p className={wizardTheme.detailPlaceholder}>
        Сначала выберите предысторию на предыдущем шаге.
      </p>
    );
  }

  const equipmentResolved = build.equipmentChoice !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.equipment}</h2>
        <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.equipment}</p>
      </div>

      {selectedBackground ? (
        <section className={wizardTheme.detailPanel}>
          <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
            Предыстория
          </p>
          <p className="mt-1 text-base font-semibold text-stone-100">
            {selectedBackground.name}
          </p>
        </section>
      ) : null}

      {hasGoldAlternative ? (
        <section className="flex flex-col gap-3">
          <h3 className={wizardTheme.sectionLabel}>Снаряжение или золото</h3>
          <div className="flex flex-col gap-2">
            <ChoiceOption
              checked={build.equipmentChoice === "equipment"}
              label="Взять стартовое снаряжение"
              name="equipment-choice"
              value="equipment"
              onChange={handleChoiceChange}
            />
            <ChoiceOption
              checked={build.equipmentChoice === "gold"}
              label={`Взять ${pack.goldAlternativeGp} зм вместо снаряжения`}
              name="equipment-choice"
              value="gold"
              onChange={handleChoiceChange}
            />
          </div>
        </section>
      ) : (
        <p className="text-sm text-stone-400">
          Для этой предыстории доступно только стартовое снаряжение.
        </p>
      )}

      {build.equipmentChoice === "gold" && hasGoldAlternative ? (
        <section aria-live="polite" className={wizardTheme.infoBanner}>
          <h3 className="font-semibold text-amber-200">Стартовое золото</h3>
          <p className="mt-2 text-sm leading-7 text-stone-300">
            Вы отказываетесь от снаряжения предыстории и получаете{" "}
            <span className="font-semibold text-stone-100">
              {pack.goldAlternativeGp} зм
            </span>
            .
          </p>
        </section>
      ) : null}

      {equipmentResolved ? (
        <>
          <CoinPurseDisplay build={build} />
          <InventoryList
            items={build.inventory}
            onRemoveShopItem={handleRemovePurchase}
          />

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className={wizardTheme.sectionLabel}>Магазин PHB</h3>
              <p className="text-sm text-stone-400">
                Снаряжение искателя приключений. Оружие и доспехи — на следующем
                шаге.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full rounded-xl border border-stone-600/80 bg-black/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                placeholder="Поиск по названию…"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as Array<PhbGearCategory | "all">).map(
                (category) => {
                  const selected = categoryFilter === category;

                  return (
                    <button
                      className={[
                        "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] transition",
                        selected
                          ? "border-amber-400/80 bg-amber-950/50 text-amber-200"
                          : "border-stone-600/80 bg-black/40 text-stone-400 hover:border-amber-600/60 hover:text-stone-200",
                      ].join(" ")}
                      key={category}
                      type="button"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {CATEGORY_LABELS[category]}
                    </button>
                  );
                },
              )}
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-stone-700/80 bg-black/40">
              {filteredCatalog.length > 0 ? (
                <ul className="divide-y divide-stone-800/80">
                  {filteredCatalog.map((item) => {
                    const affordable = canAffordCost(build.coins, item.costCp);
                    const owned = build.inventory.find(
                      (entry) =>
                        entry.catalogId === item.id && entry.source === "shop",
                    );

                    return (
                      <li
                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        key={item.id}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-100">
                            {item.nameRu}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {formatCostCp(item.costCp)}
                            {item.weightLb > 0
                              ? ` · ${formatWeightLb(item.weightLb)} фн`
                              : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {owned ? (
                            <button
                              className={wizardTheme.navButtonSecondary}
                              type="button"
                              onClick={() => handleRemovePurchase(item.id)}
                            >
                              −
                            </button>
                          ) : null}
                          <button
                            className={wizardTheme.navButtonPrimary}
                            disabled={!affordable}
                            type="button"
                            onClick={() => handlePurchase(item.id)}
                          >
                            Купить
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={wizardTheme.detailPlaceholder}>
                  Ничего не найдено. Измените поиск или фильтр.
                </p>
              )}
            </div>
          </section>
        </>
      ) : !hasGoldAlternative && pack.items.length === 0 ? (
        <p className={wizardTheme.detailPlaceholder}>
          Для этой предыстории нет описанного снаряжения.
        </p>
      ) : null}
    </div>
  );
}
