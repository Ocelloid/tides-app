"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CHARACTER_BUILD_STEPS,
  canAdvanceToStep,
  type CharacterBuild,
  type CharacterBuildStep,
} from "~/lib/character";

import { StepIndicator } from "./StepIndicator";
import { AbilityScoresStep } from "./steps/AbilityScoresStep";
import { BackgroundStep } from "./steps/BackgroundStep";
import { ClassStep } from "./steps/ClassStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { RaceStep } from "./steps/RaceStep";
import { ReviewStep } from "./steps/ReviewStep";
import { WeaponMagicStep } from "./steps/WeaponMagicStep";
import { WizardNavigation } from "./WizardNavigation";
import { wizardTheme } from "./wizardTheme";

function renderStepContent(
  step: CharacterBuildStep,
  build: CharacterBuild,
  onBuildChange: (build: CharacterBuild) => void,
  onGoToStep: (step: CharacterBuildStep) => void,
) {
  switch (step) {
    case "class":
      return <ClassStep build={build} onChange={onBuildChange} />;
    case "race":
      return <RaceStep build={build} onChange={onBuildChange} />;
    case "background":
      return <BackgroundStep build={build} onChange={onBuildChange} />;
    case "abilities":
      return <AbilityScoresStep build={build} onChange={onBuildChange} />;
    case "equipment":
      return <EquipmentStep build={build} onChange={onBuildChange} />;
    case "weapons-magic":
      return <WeaponMagicStep build={build} onChange={onBuildChange} />;
    case "review":
      return <ReviewStep build={build} onEditStep={onGoToStep} />;
    default:
      return null;
  }
}

export type CharacterCreationWizardProps = {
  build: CharacterBuild;
  onBuildChange: (build: CharacterBuild) => void;
  onComplete: () => void;
  onStepChange?: (step: CharacterBuildStep) => void;
  initialStep?: CharacterBuildStep;
};

export function CharacterCreationWizard({
  build,
  onBuildChange,
  onComplete,
  onStepChange,
  initialStep = "class",
}: CharacterCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<CharacterBuildStep>(initialStep);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const goToStep = useCallback((step: CharacterBuildStep) => {
    setCurrentStep(step);
  }, []);

  const goBack = useCallback(() => {
    const index = CHARACTER_BUILD_STEPS.indexOf(currentStep);
    const previousStep = CHARACTER_BUILD_STEPS[index - 1];
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  }, [currentStep]);

  const goNext = useCallback(() => {
    const index = CHARACTER_BUILD_STEPS.indexOf(currentStep);
    const nextStep = CHARACTER_BUILD_STEPS[index + 1];
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(
    (step: CharacterBuildStep) => {
      if (canAdvanceToStep(build, step) || step === currentStep) {
        goToStep(step);
      }
    },
    [build, currentStep, goToStep],
  );

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator
        build={build}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <article className={wizardTheme.article}>
        {renderStepContent(currentStep, build, onBuildChange, goToStep)}
      </article>

      <WizardNavigation
        build={build}
        currentStep={currentStep}
        onBack={goBack}
        onComplete={onComplete}
        onNext={goNext}
      />
    </div>
  );
}
