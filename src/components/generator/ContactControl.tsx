"use client";

import {
  contactRelationOptions,
  contactStatOptions,
  rerollSection,
  setContactChoice,
  type Chronicle,
  type Contact,
  type ContactKind,
} from "~/lib/chronicle";

import { RollBadge } from "./RollBadge";
import { describeOption } from "./types";

export function ContactControl({
  title,
  kind,
  contact,
  chronicle,
  onChange,
  index,
}: {
  title: string;
  kind: ContactKind;
  contact: Contact;
  chronicle: Chronicle;
  onChange: (next: Chronicle) => void;
  index: number;
}) {
  function chooseRelation(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(
      setContactChoice(
        chronicle,
        kind,
        index,
        "relation",
        event.currentTarget.value,
      ),
    );
  }

  function chooseStat(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(
      setContactChoice(
        chronicle,
        kind,
        index,
        "stat",
        event.currentTarget.value,
      ),
    );
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-stone-950/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
              {title}
            </p>
            <p className="text-xs leading-5 text-stone-400">
              Выберите отношение и личность вручную или перебросьте контакт.
            </p>
          </div>
          <button
            className="shrink-0 cursor-pointer rounded-full border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
            type="button"
            onClick={() => onChange(rerollSection(chronicle, kind, index))}
          >
            Перебросить
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <RollBadge dice="к100 связь" roll={contact.relation.roll} />
          <RollBadge dice="к100 личность" roll={contact.stat.roll} />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Отношение
          </span>
          <select
            className="w-full cursor-pointer rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-300"
            value={contact.relation.entry.id}
            onChange={chooseRelation}
          >
            {contactRelationOptions(kind).map((option) => (
              <option key={option.id} value={option.id}>
                {describeOption(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Личность
          </span>
          <select
            className="w-full cursor-pointer rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-300"
            value={contact.stat.entry.id}
            onChange={chooseStat}
          >
            {contactStatOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {describeOption(option)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
