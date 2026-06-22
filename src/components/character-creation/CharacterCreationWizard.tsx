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
import { GeneratorHeader } from "../generator/GeneratorPage";

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

  const scrollPageToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

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
      scrollPageToTop();
    }
  }, [currentStep, scrollPageToTop]);

  const handleComplete = useCallback(() => {
    scrollPageToTop();
    onComplete();
  }, [onComplete, scrollPageToTop]);

  const handleStepClick = useCallback(
    (step: CharacterBuildStep) => {
      if (canAdvanceToStep(build, step) || step === currentStep) {
        goToStep(step);
      }
    },
    [build, currentStep, goToStep],
  );

  return (
    <div className="flex flex-col gap-4">
      <GeneratorHeader
        description={`Создайте нового персонажа или перетащите файл с существующим персонажем.`}
        title="Создание персонажа"
      >
        <StepIndicator
          build={build}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </GeneratorHeader>

      <article className={wizardTheme.article}>
        {renderStepContent(currentStep, build, onBuildChange, goToStep)}
      </article>

      <WizardNavigation
        build={build}
        currentStep={currentStep}
        onBack={goBack}
        onComplete={handleComplete}
        onNext={goNext}
      />
    </div>
  );
}
