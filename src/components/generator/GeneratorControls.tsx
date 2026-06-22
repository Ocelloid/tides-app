"use client";

import {
  ageDiceSides,
  ageOptions,
  classDiceSides,
  classOptions,
  currentFoodOptions,
  currentSettlementOptions,
  eyeColorDiceSides,
  eyeColorOptions,
  familySizeOptions,
  genderDiceSides,
  genderOptions,
  hairColorDiceSides,
  hairColorOptions,
  raceDiceSides,
  raceOptions,
  rerollSection,
  skinColorDiceSides,
  skinColorOptions,
  statusDiceSides,
  statusOptions,
  type Chronicle,
} from "~/lib/chronicle";
import {
  backgrounds,
  familyRelations,
  fateMoments,
  homelandTable,
  prophecies,
  secrets,
} from "~/lib/chronicle/chronicle";

import { ContactControl } from "./ContactControl";
import { CharacterNameControl } from "./CharacterNameControl";
import { CountControl } from "./CountControl";
import { SectionControl } from "./SectionControl";

export function GeneratorControls({
  chronicle,
  onChange,
  characterName,
  onCharacterNameChange,
  characterNamePlaceholder,
  onCharacterNamePlaceholderChange,
  wizardCompleted = false,
}: {
  chronicle: Chronicle;
  onChange: (next: Chronicle) => void;
  characterName: string;
  onCharacterNameChange: (name: string) => void;
  characterNamePlaceholder: string;
  onCharacterNamePlaceholderChange: (example: string) => void;
  wizardCompleted?: boolean;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <CharacterNameControl
        chronicle={chronicle}
        exampleName={characterNamePlaceholder}
        value={characterName}
        onChange={onCharacterNameChange}
        onExampleChange={onCharacterNamePlaceholderChange}
      />
      <SectionControl
        title="Раса"
        section="race"
        value={chronicle.race.entry.id}
        options={raceOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${raceDiceSides()}`}
        roll={chronicle.race.roll}
        locked={wizardCompleted}
      />
      <SectionControl
        title="Класс"
        section="characterClass"
        value={chronicle.characterClass.entry.id}
        options={classOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${classDiceSides()}`}
        roll={chronicle.characterClass.roll}
        locked={wizardCompleted}
      />
      <SectionControl
        title="Пол"
        section="gender"
        value={chronicle.gender.entry.id}
        options={genderOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${genderDiceSides()}`}
        roll={chronicle.gender.roll}
      />
      <SectionControl
        title="Возраст"
        section="age"
        value={chronicle.age.entry.id}
        options={ageOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${ageDiceSides()}`}
        roll={chronicle.age.roll}
      />
      <SectionControl
        title="Статус"
        section="status"
        value={chronicle.status.entry.id}
        options={statusOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${statusDiceSides()}`}
        roll={chronicle.status.roll}
      />
      <SectionControl
        title="Цвет волос"
        section="hairColor"
        value={chronicle.hairColor.entry.id}
        options={hairColorOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${hairColorDiceSides()}`}
        roll={chronicle.hairColor.roll}
      />
      <SectionControl
        title="Цвет глаз"
        section="eyeColor"
        value={chronicle.eyeColor.entry.id}
        options={eyeColorOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${eyeColorDiceSides()}`}
        roll={chronicle.eyeColor.roll}
      />
      <SectionControl
        title="Цвет кожи"
        section="skinColor"
        value={chronicle.skinColor.entry.id}
        options={skinColorOptions()}
        chronicle={chronicle}
        onChange={onChange}
        dice={`к${skinColorDiceSides()}`}
        roll={chronicle.skinColor.roll}
      />
      <SectionControl
        title="Родина"
        section="homeland"
        value={chronicle.homeland.entry.id}
        options={homelandTable}
        chronicle={chronicle}
        onChange={onChange}
        dice="к100"
        roll={chronicle.homeland.roll}
      />
      <SectionControl
        title="Родное поселение"
        section="settlement"
        value={chronicle.settlement.entry.id}
        options={currentSettlementOptions(chronicle)}
        chronicle={chronicle}
        onChange={onChange}
        dice="к100"
        roll={chronicle.settlement.roll}
      />
      <SectionControl
        title="Предыстория"
        section="background"
        value={chronicle.background.entry.id}
        options={backgrounds}
        chronicle={chronicle}
        onChange={onChange}
        dice="к20"
        roll={chronicle.background.roll}
        locked={wizardCompleted}
      />
      <SectionControl
        title="Размер семьи"
        section="family"
        value={chronicle.familySize.entry.id}
        options={familySizeOptions(chronicle)}
        chronicle={chronicle}
        onChange={onChange}
        dice="к100"
        roll={chronicle.familySize.roll}
      />
      <SectionControl
        title="Семейное отношение"
        section="familyRelation"
        value={chronicle.familyRelation.entry.id}
        options={familyRelations}
        chronicle={chronicle}
        onChange={onChange}
        dice="к100"
        roll={chronicle.familyRelation.roll}
      />
      <SectionControl
        title="Любимая еда"
        section="food"
        value={chronicle.food.entry.id}
        options={currentFoodOptions(chronicle)}
        chronicle={chronicle}
        onChange={onChange}
        dice="к8"
        roll={chronicle.food.roll}
      />
      <div className="rounded-2xl border border-amber-900/30 bg-stone-950/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
              Союзники и соперники
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Пересобирает все связи по выбранному количеству.
            </p>
          </div>
          <button
            className="rounded-full border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
            type="button"
            onClick={() => onChange(rerollSection(chronicle, "contacts"))}
          >
            Перебросить
          </button>
        </div>
      </div>
      <CountControl
        title="Количество союзников"
        value={chronicle.allyCount}
        countKey="allies"
        chronicle={chronicle}
        onChange={onChange}
        hint={`Подсказка по статусу: ${chronicle.socialAllyCount}`}
      />
      {chronicle.allies.map((contact, index) => (
        <ContactControl
          key={"ally-" + index}
          title={"Союзник " + (index + 1)}
          kind="ally"
          contact={contact}
          chronicle={chronicle}
          onChange={onChange}
          index={index}
        />
      ))}
      <CountControl
        title="Количество соперников"
        value={chronicle.rivalCount}
        countKey="rivals"
        chronicle={chronicle}
        onChange={onChange}
        hint={`Подсказка по статусу: ${chronicle.socialRivalCount}`}
      />
      {chronicle.rivals.map((contact, index) => (
        <ContactControl
          key={"rival-" + index}
          title={"Соперник " + (index + 1)}
          kind="rival"
          contact={contact}
          chronicle={chronicle}
          onChange={onChange}
          index={index}
        />
      ))}
      <CountControl
        title="Количество судьбоносных моментов"
        value={chronicle.fateCount}
        countKey="fate"
        chronicle={chronicle}
        onChange={onChange}
        hint="Сколько блоков вывести в итоговом тексте."
      />
      {chronicle.fate.map((item, index) => (
        <SectionControl
          key={"fate-" + index}
          title={"Судьбоносный момент " + (index + 1)}
          section="fate"
          value={item.entry.id}
          options={fateMoments}
          chronicle={chronicle}
          onChange={onChange}
          index={index}
          dice="к20"
          roll={item.roll}
        />
      ))}
      <CountControl
        title="Количество секретов"
        value={chronicle.secretCount}
        countKey="secrets"
        chronicle={chronicle}
        onChange={onChange}
        hint="Можно выбрать 0, если секреты не нужны."
      />
      {chronicle.secrets.map((item, index) => (
        <SectionControl
          key={"secret-" + index}
          title={"Таинственный секрет " + (index + 1)}
          section="secret"
          value={item.entry.id}
          options={secrets}
          chronicle={chronicle}
          onChange={onChange}
          index={index}
          dice="к20"
          roll={item.roll}
        />
      ))}
      <CountControl
        title="Количество пророчеств"
        value={chronicle.prophecyCount}
        countKey="prophecies"
        chronicle={chronicle}
        onChange={onChange}
        hint="Можно оставить пустой список или выбрать до пяти целей."
      />
      {chronicle.prophecyList.map((item, index) => (
        <SectionControl
          key={"prophecy-" + index}
          title={"Пророчество " + (index + 1)}
          section="prophecies"
          value={item.entry.id}
          options={prophecies}
          chronicle={chronicle}
          onChange={onChange}
          index={index}
          dice="к20"
          roll={item.roll}
        />
      ))}
    </aside>
  );
}
