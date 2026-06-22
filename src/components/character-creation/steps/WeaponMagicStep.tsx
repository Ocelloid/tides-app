"use client";

import { useCallback, useMemo, useState } from "react";

import { classOptions } from "~/lib/chronicle";
import {
  PHB_WEAPONS_CATALOG,
  buildSpellcastingInfo,
  canAffordCost,
  computeCombatStats,
  computeMonkUnarmedAttack,
  computeWeaponAttack,
  formatCostCp,
  getCantripsKnown,
  getCombinedCasterLevel,
  getInventoryWeapons,
  getMaxSpellLevelForClass,
  getSpellById,
  getSpellSlots,
  getSpellsForClass,
  getSpellsKnownLimit,
  getSpellsPreparedLimit,
  hasSpellcasting,
  isSpellcastingClass,
  purchaseWeapon,
  setAttacksSpellcastingNotes,
  setSelectedSpells,
  setWeaponAttacks,
  validateSpellSelection,
  type CharacterBuild,
  type PhbWeapon,
  type SpellSelection,
  type WeaponAttack,
} from "~/lib/character";

import { CoinPurseDisplay } from "../CoinPurseDisplay";
import {
  WEAPONS_MAGIC_DESCRIPTION,
  WEAPONS_MAGIC_LABEL,
} from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

type WeaponMagicStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

const MAX_WEAPON_ATTACKS = 3;

function attackKey(attack: WeaponAttack): string {
  return attack.weaponId ?? attack.name;
}

function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : String(bonus);
}

function formatSlots(slots: Record<number, number>): string {
  const entries = Object.entries(slots)
    .map(([level, count]) => [Number(level), count] as const)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a - b);

  if (entries.length === 0) {
    return "нет";
  }

  return entries.map(([level, count]) => `${level} ур.: ${count}`).join(", ");
}

function classDisplayName(classId: string): string {
  return classOptions().find((entry) => entry.id === classId)?.name ?? classId;
}

function WeaponAttacksSection({
  build,
  onChange,
}: WeaponMagicStepProps) {
  const stats = useMemo(() => computeCombatStats(build), [build]);
  const inventoryWeapons = useMemo(
    () => getInventoryWeapons(build.inventory),
    [build.inventory],
  );

  const monkUnarmed = useMemo(() => {
    if (!stats) {
      return null;
    }

    return computeMonkUnarmedAttack(
      build,
      stats.proficiencyBonus,
      build.abilityScores!.modifier.dex,
    );
  }, [build, stats]);

  const ownedWeaponIds = useMemo(() => {
    const ids = new Set(inventoryWeapons.map((weapon) => weapon.id));
    if (monkUnarmed) {
      ids.add("__unarmed__");
    }
    return ids;
  }, [inventoryWeapons, monkUnarmed]);

  const selectedKeys = useMemo(
    () => new Set(build.weaponAttacks.map(attackKey)),
    [build.weaponAttacks],
  );

  const handleToggleAttack = useCallback(
    (attack: WeaponAttack) => {
      const key = attackKey(attack);
      const isSelected = selectedKeys.has(key);

      if (isSelected) {
        onChange(
          setWeaponAttacks(
            build,
            build.weaponAttacks.filter((entry) => attackKey(entry) !== key),
          ),
        );
        return;
      }

      if (build.weaponAttacks.length >= MAX_WEAPON_ATTACKS) {
        return;
      }

      onChange(setWeaponAttacks(build, [...build.weaponAttacks, attack]));
    },
    [build, onChange, selectedKeys],
  );

  const handlePurchase = useCallback(
    (weaponId: string) => {
      onChange(purchaseWeapon(build, weaponId));
    },
    [build, onChange],
  );

  const buildAttackForWeapon = useCallback(
    (weapon: PhbWeapon): WeaponAttack | null => {
      if (!stats || !build.abilityScores) {
        return null;
      }

      return computeWeaponAttack(
        build,
        weapon,
        stats.proficiencyBonus,
        build.abilityScores.modifier,
      );
    },
    [build, stats],
  );

  const purchasableWeapons = useMemo(
    () =>
      PHB_WEAPONS_CATALOG.filter(
        (weapon) => !inventoryWeapons.some((owned) => owned.id === weapon.id),
      ),
    [inventoryWeapons],
  );

  if (!build.equipmentChoice) {
    return (
      <p className={wizardTheme.detailPlaceholder}>
        Сначала завершите шаг «Снаряжение» — выберите пакет или золото.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className={wizardTheme.sectionLabel}>Оружие</h3>
        <p className="mt-1 text-sm text-stone-400">
          Выберите до {MAX_WEAPON_ATTACKS} основных атак для листа персонажа.
        </p>
      </div>

      <CoinPurseDisplay build={build} totalLabel="Остаток:" />

      {build.weaponAttacks.length > 0 ? (
        <section className={wizardTheme.detailPanel}>
          <h4 className={wizardTheme.detailTitle}>Выбранные атаки</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {build.weaponAttacks.map((attack, index) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-700/80 bg-black/30 px-3 py-2"
                key={`${attackKey(attack)}-${index}`}
              >
                <div>
                  <p className="text-sm font-medium text-stone-100">
                    {index + 1}. {attack.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatAttackBonus(attack.attackBonus)} к атаке · {attack.damage}
                  </p>
                </div>
                <button
                  className={wizardTheme.navButtonSecondary}
                  type="button"
                  onClick={() => handleToggleAttack(attack)}
                >
                  Убрать
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={wizardTheme.detailPlaceholder}>
          Атаки не выбраны — это допустимо.
        </p>
      )}

      {inventoryWeapons.length > 0 || monkUnarmed ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-stone-200">Из инвентаря</h4>
          <ul className="flex flex-col gap-2">
            {inventoryWeapons.map((weapon) => {
              const attack = buildAttackForWeapon(weapon);
              if (!attack) {
                return null;
              }

              const selected = selectedKeys.has(weapon.id);
              const atLimit =
                !selected && build.weaponAttacks.length >= MAX_WEAPON_ATTACKS;

              return (
                <li key={weapon.id}>
                  <button
                    aria-pressed={selected}
                    className={[
                      wizardTheme.selectCard.base,
                      "w-full justify-between",
                      selected
                        ? wizardTheme.selectCard.selected
                        : wizardTheme.selectCard.unselected,
                      atLimit ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    disabled={atLimit}
                    type="button"
                    onClick={() => handleToggleAttack(attack)}
                  >
                    <span className="text-sm text-stone-100">{weapon.nameRu}</span>
                    <span className="text-xs tabular-nums text-stone-400">
                      {formatAttackBonus(attack.attackBonus)} · {attack.damage}
                    </span>
                  </button>
                </li>
              );
            })}
            {monkUnarmed ? (
              <li>
                <button
                  aria-pressed={selectedKeys.has("__unarmed__")}
                  className={[
                    wizardTheme.selectCard.base,
                    "w-full justify-between",
                    selectedKeys.has("__unarmed__")
                      ? wizardTheme.selectCard.selected
                      : wizardTheme.selectCard.unselected,
                  ].join(" ")}
                  disabled={
                    !selectedKeys.has("__unarmed__") &&
                    build.weaponAttacks.length >= MAX_WEAPON_ATTACKS
                  }
                  type="button"
                  onClick={() => handleToggleAttack(monkUnarmed)}
                >
                  <span className="text-sm text-stone-100">{monkUnarmed.name}</span>
                  <span className="text-xs tabular-nums text-stone-400">
                    {formatAttackBonus(monkUnarmed.attackBonus)} · {monkUnarmed.damage}
                  </span>
                </button>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-stone-200">Купить оружие</h4>
        <div className="max-h-72 overflow-y-auto rounded-xl border border-stone-700/80 bg-black/40">
          {purchasableWeapons.length > 0 ? (
            <ul className="divide-y divide-stone-800/80">
              {purchasableWeapons.map((weapon) => {
                const affordable = canAffordCost(build.coins, weapon.costCp);
                const attack = buildAttackForWeapon(weapon);
                const owned = ownedWeaponIds.has(weapon.id);
                const selected = selectedKeys.has(weapon.id);

                return (
                  <li
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    key={weapon.id}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-100">
                        {weapon.nameRu}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatCostCp(weapon.costCp)} · {weapon.damage}{" "}
                        {weapon.damageTypeRu}
                        {attack
                          ? ` · ${formatAttackBonus(attack.attackBonus)} к атаке`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {owned && attack ? (
                        <button
                          className={[
                            wizardTheme.navButtonSecondary,
                            selected ? "border-amber-400/80" : "",
                          ].join(" ")}
                          disabled={
                            !selected &&
                            build.weaponAttacks.length >= MAX_WEAPON_ATTACKS
                          }
                          type="button"
                          onClick={() => handleToggleAttack(attack)}
                        >
                          {selected ? "Выбрано" : "Атака"}
                        </button>
                      ) : null}
                      <button
                        className={wizardTheme.navButtonPrimary}
                        disabled={!affordable}
                        type="button"
                        onClick={() => handlePurchase(weapon.id)}
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
              Весь каталог уже в инвентаре.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}

function SpellClassPanel({
  build,
  classId,
  onChange,
}: {
  build: CharacterBuild;
  classId: string;
  onChange: (build: CharacterBuild) => void;
}) {
  const classLevel =
    build.classLevels.find((entry) => entry.classId === classId)?.level ?? 0;
  const stats = useMemo(() => computeCombatStats(build), [build]);
  const spellcastingInfo = useMemo(() => {
    if (!stats) {
      return null;
    }

    return buildSpellcastingInfo(build, classId, stats.proficiencyBonus);
  }, [build, classId, stats]);

  const maxSpellLevel = getMaxSpellLevelForClass(classId, classLevel);
  const availableSpells = useMemo(
    () => getSpellsForClass(classId, maxSpellLevel),
    [classId, maxSpellLevel],
  );

  const cantrips = availableSpells.filter((spell) => spell.level === 0);
  const leveledSpells = availableSpells.filter((spell) => spell.level > 0);

  const classSelections = useMemo(
    () => build.selectedSpells.filter((entry) => entry.classId === classId),
    [build.selectedSpells, classId],
  );

  const selectedSpellIds = useMemo(
    () => new Set(classSelections.map((entry) => entry.spellId)),
    [classSelections],
  );

  const cantripCount = classSelections.filter(
    (entry) => (getSpellById(entry.spellId)?.level ?? -1) === 0,
  ).length;
  const leveledCount = classSelections.filter(
    (entry) => (getSpellById(entry.spellId)?.level ?? 0) > 0,
  ).length;
  const preparedCount = classSelections.filter(
    (entry) =>
      entry.prepared && (getSpellById(entry.spellId)?.level ?? 0) > 0,
  ).length;

  const cantripLimit = getCantripsKnown(classId, classLevel);
  const knownLimit = getSpellsKnownLimit(classId, classLevel);
  const preparedLimit =
    build.abilityScores && spellcastingInfo?.spellsPreparedLimit !== undefined
      ? getSpellsPreparedLimit(
          classId,
          classLevel,
          build.abilityScores.modifier[spellcastingInfo.ability],
        )
      : undefined;

  const usesPrepared = preparedLimit !== undefined;

  const tryApplySpells = useCallback(
    (nextSpells: SpellSelection[]) => {
      const merged = [
        ...build.selectedSpells.filter((entry) => entry.classId !== classId),
        ...nextSpells,
      ];
      const validation = validateSpellSelection({
        ...build,
        selectedSpells: merged,
      });

      if (!validation.valid) {
        return;
      }

      onChange(setSelectedSpells(build, merged));
    },
    [build, classId, onChange],
  );

  const toggleSpell = useCallback(
    (spellId: string, prepared = false) => {
      const spell = getSpellById(spellId);
      if (!spell) {
        return;
      }

      if (selectedSpellIds.has(spellId)) {
        tryApplySpells(classSelections.filter((entry) => entry.spellId !== spellId));
        return;
      }

      const isCantrip = spell.level === 0;
      if (isCantrip && cantripCount >= cantripLimit) {
        return;
      }

      if (!isCantrip && knownLimit !== undefined && leveledCount >= knownLimit) {
        return;
      }

      tryApplySpells([
        ...classSelections,
        { spellId, classId, prepared: isCantrip ? false : prepared },
      ]);
    },
    [
      cantripCount,
      cantripLimit,
      classId,
      classSelections,
      knownLimit,
      leveledCount,
      selectedSpellIds,
      tryApplySpells,
    ],
  );

  const togglePrepared = useCallback(
    (spellId: string) => {
      const next = classSelections.map((entry) =>
        entry.spellId === spellId ? { ...entry, prepared: !entry.prepared } : entry,
      );

      if (preparedLimit !== undefined) {
        const nextPrepared = next.filter(
          (entry) =>
            entry.prepared && (getSpellById(entry.spellId)?.level ?? 0) > 0,
        ).length;
        if (nextPrepared > preparedLimit) {
          return;
        }
      }

      tryApplySpells(next);
    },
    [classSelections, preparedLimit, tryApplySpells],
  );

  if (!spellcastingInfo || !stats) {
    return (
      <p className={wizardTheme.detailPlaceholder}>
        Задайте характеристики на предыдущем шаге.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={wizardTheme.detailPanel}>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">СЛ заклинаний</dt>
            <dd className="font-semibold text-stone-100">
              {spellcastingInfo.spellSaveDc}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Бонус атаки заклинанием</dt>
            <dd className="font-semibold text-stone-100">
              {formatAttackBonus(spellcastingInfo.spellAttackBonus)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Ячейки</dt>
            <dd className="text-stone-200">{formatSlots(spellcastingInfo.slots)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Заговоры</dt>
            <dd className="text-stone-200">
              {cantripCount} / {cantripLimit}
            </dd>
          </div>
          {knownLimit !== undefined ? (
            <div>
              <dt className="text-stone-500">Известные заклинания</dt>
              <dd className="text-stone-200">
                {leveledCount} / {knownLimit}
              </dd>
            </div>
          ) : null}
          {preparedLimit !== undefined ? (
            <div>
              <dt className="text-stone-500">Подготовленные</dt>
              <dd className="text-stone-200">
                {preparedCount} / {preparedLimit}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {cantripLimit > 0 && cantripCount === 0 ? (
        <section className={wizardTheme.warningBanner} role="status">
          Рекомендуется выбрать заговоры — на этом уровне доступно {cantripLimit}.
        </section>
      ) : null}

      {cantrips.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-stone-200">Заговоры</h4>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cantrips.map((spell) => {
              const selected = selectedSpellIds.has(spell.id);
              const atLimit = !selected && cantripCount >= cantripLimit;

              return (
                <li key={spell.id}>
                  <button
                    aria-pressed={selected}
                    className={[
                      wizardTheme.selectCard.base,
                      "w-full justify-between py-2.5",
                      selected
                        ? wizardTheme.selectCard.selected
                        : wizardTheme.selectCard.unselected,
                      atLimit ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    disabled={atLimit}
                    type="button"
                    onClick={() => toggleSpell(spell.id)}
                  >
                    <span className="text-sm text-stone-100">{spell.nameRu}</span>
                    {selected ? (
                      <span className="text-xs font-semibold text-amber-300">✓</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {leveledSpells.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-stone-200">
            {usesPrepared ? "Заклинания (известные / подготовленные)" : "Заклинания"}
          </h4>
          <ul className="flex flex-col gap-2">
            {leveledSpells.map((spell) => {
              const selected = selectedSpellIds.has(spell.id);
              const selection = classSelections.find(
                (entry) => entry.spellId === spell.id,
              );
              const atKnownLimit =
                !selected && knownLimit !== undefined && leveledCount >= knownLimit;

              return (
                <li
                  className="flex flex-col gap-2 rounded-xl border border-stone-700/80 bg-black/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  key={spell.id}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-100">
                      {spell.nameRu}
                    </p>
                    <p className="text-xs text-stone-500">{spell.level} уровень</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {usesPrepared && selected ? (
                      <label className="flex items-center gap-2 text-xs text-stone-300">
                        <input
                          checked={selection?.prepared ?? false}
                          className="accent-amber-400"
                          type="checkbox"
                          onChange={() => togglePrepared(spell.id)}
                        />
                        Подготовлено
                      </label>
                    ) : null}
                    <button
                      aria-pressed={selected}
                      className={[
                        wizardTheme.navButtonSecondary,
                        selected ? "border-amber-400/80 text-amber-200" : "",
                      ].join(" ")}
                      disabled={atKnownLimit}
                      type="button"
                      onClick={() => toggleSpell(spell.id, usesPrepared)}
                    >
                      {selected ? "Убрать" : "Выбрать"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className={wizardTheme.detailPlaceholder}>
          Нет доступных заклинаний на текущем уровне класса.
        </p>
      )}
    </div>
  );
}

function SpellsSection({ build, onChange }: WeaponMagicStepProps) {
  const casterClasses = useMemo(
    () =>
      build.classLevels
        .filter((entry) => isSpellcastingClass(entry.classId))
        .map((entry) => entry.classId),
    [build.classLevels],
  );

  const [activeClassId, setActiveClassId] = useState(
    () => casterClasses[0] ?? "",
  );

  const resolvedActiveClassId = casterClasses.includes(activeClassId)
    ? activeClassId
    : (casterClasses[0] ?? "");

  const combinedCasterLevel = getCombinedCasterLevel(build.classLevels);
  const combinedSlots = getSpellSlots(combinedCasterLevel);
  const spellValidation = validateSpellSelection(build);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className={wizardTheme.sectionLabel}>Заклинания</h3>
        <p className="mt-1 text-sm text-stone-400">
          Выбор заклинаний для каждого заклинательного класса отдельно.
        </p>
      </div>

      <section className={wizardTheme.detailPanel}>
        <h4 className={wizardTheme.detailTitle}>Общие ячейки (PHB multiclass)</h4>
        <p className="mt-2 text-sm text-stone-300">
          Эффективный уровень заклинателя:{" "}
          <span className="font-semibold text-amber-200">{combinedCasterLevel}</span>
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Ячейки: {formatSlots(combinedSlots)}
        </p>
        {casterClasses.length > 2 ? (
          <p className="mt-2 text-xs text-amber-200/90">
            Более двух заклинательных классов — в PDF часть данных уйдёт в заметки
            (AttacksSpellcasting).
          </p>
        ) : null}
      </section>

      {!spellValidation.valid && build.selectedSpells.length > 0 ? (
        <section className={wizardTheme.errorBanner} role="alert">
          {spellValidation.message}
        </section>
      ) : null}

      {casterClasses.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {casterClasses.map((classId) => {
            const selected = resolvedActiveClassId === classId;

            return (
              <button
                className={[
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] transition",
                  selected
                    ? "border-amber-400/80 bg-amber-950/50 text-amber-200"
                    : "border-stone-600/80 bg-black/40 text-stone-400 hover:border-amber-600/60 hover:text-stone-200",
                ].join(" ")}
                key={classId}
                type="button"
                onClick={() => setActiveClassId(classId)}
              >
                {classDisplayName(classId)}
              </button>
            );
          })}
        </div>
      ) : null}

      {resolvedActiveClassId ? (
        <SpellClassPanel
          build={build}
          classId={resolvedActiveClassId}
          onChange={onChange}
        />
      ) : null}
    </section>
  );
}

export function WeaponMagicStep({ build, onChange }: WeaponMagicStepProps) {
  const showSpells = hasSpellcasting(build);

  const handleNotesChange = useCallback(
    (notes: string) => {
      onChange(setAttacksSpellcastingNotes(build, notes));
    },
    [build, onChange],
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className={wizardTheme.stepHeading}>{WEAPONS_MAGIC_LABEL}</h2>
        <p className={wizardTheme.stepDescription}>{WEAPONS_MAGIC_DESCRIPTION}</p>
      </div>

      <WeaponAttacksSection build={build} onChange={onChange} />

      {showSpells ? <SpellsSection build={build} onChange={onChange} /> : null}

      <section className="flex flex-col gap-2">
        <h3 className={wizardTheme.sectionLabel}>Прочие атаки и заметки</h3>
        <p className="text-sm text-stone-400">
          Дополнительные атаки, описания заклинаний и overflow для PDF-блока
          «Атаки и заклинания».
        </p>
        <textarea
          className="min-h-28 w-full rounded-xl border border-stone-600/80 bg-black/50 px-4 py-3 text-sm leading-6 text-stone-100 placeholder:text-stone-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          placeholder="Например: вторичный кастер, дополнительные атаки, тексты заклинаний…"
          value={build.attacksSpellcastingNotes}
          onChange={(event) => handleNotesChange(event.target.value)}
        />
      </section>
    </div>
  );
}
