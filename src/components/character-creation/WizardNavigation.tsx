"use client";

import {
  CHARACTER_BUILD_STEPS,
  type CharacterBuild,
  type CharacterBuildStep,
  isStepComplete,
} from "~/lib/character";

import { STEP_LABELS } from "./stepLabels";
import { wizardTheme } from "./wizardTheme";

type WizardNavigationProps = {
  currentStep: CharacterBuildStep;
  build: CharacterBuild;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
};

export function WizardNavigation({
  currentStep,
  build,
  onBack,
  onNext,
  onComplete,
}: WizardNavigationProps) {
  const stepIndex = CHARACTER_BUILD_STEPS.indexOf(currentStep);
  const isFirstStep = stepIndex === 0;
  const isReviewStep = currentStep === "review";
  const canProceed = isStepComplete(build, currentStep);

  return (
    <div className={`${wizardTheme.navBar} flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between`}>
      <button
        className={wizardTheme.navButtonSecondary}
        disabled={isFirstStep}
        type="button"
        onClick={onBack}
      >
        Назад
      </button>

      {isReviewStep ? (
        <button
          className={wizardTheme.navButtonPrimary}
          disabled={!canProceed}
          type="button"
          onClick={onComplete}
        >
          Создать персонажа
        </button>
      ) : (
        <button
          className={wizardTheme.navButtonPrimary}
          disabled={!canProceed}
          type="button"
          onClick={onNext}
        >
          Далее
        </button>
      )}
    </div>
  );
}
