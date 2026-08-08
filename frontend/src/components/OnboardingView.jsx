import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'overwhelm_reaction',
    title: "When you feel completely overwhelmed by a task, what is your brain's default reaction?",
    placeholder: "e.g., I freeze and scroll on my phone, or I try to over-plan everything..."
  },
  {
    id: 'inner_critic',
    title: "How does your inner critic usually sound when you make a mistake?",
    placeholder: "e.g., It tells me I'm lazy, or that I always mess things up..."
  },
  {
    id: 'bad_habit',
    title: "If I (Nova) could intercept one bad habit or loop for you, what would it be?",
    placeholder: "e.g., Staying up too late to regain control of my day, or avoiding emails..."
  },
  {
    id: 'social_stress',
    title: "What is the hardest part about reaching out to friends when you're stressed?",
    placeholder: "e.g., I feel like a burden, or I don't have the energy to explain everything..."
  },
  {
    id: 'boundaries',
    title: "What is one communication boundary you want me to absolutely respect?",
    placeholder: "e.g., Please no toxic positivity, or don't tell me to 'just do it'..."
  }
];

export default function OnboardingView({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    overwhelm_reaction: '',
    inner_critic: '',
    bad_habit: '',
    social_stress: '',
    boundaries: ''
  });

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      // Complete onboarding
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const currentQuestion = QUESTIONS[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const isLastStep = currentStep === QUESTIONS.length - 1;

  return (
    <div className="flex flex-col h-screen bg-background text-text-main font-sans">
      
      {/* Top Bar with Progress */}
      <div className="pt-12 px-6 pb-6">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handlePrev}
            className={`p-2 rounded-full hover:bg-surface transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft size={20} className="text-text-muted" />
          </button>
          <span className="text-xs font-semibold tracking-widest uppercase text-text-muted">
            {currentStep + 1} / {QUESTIONS.length}
          </span>
          <div className="w-9" /> {/* Spacer for balance */}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-8 pb-10">
        
        <div className="mt-8 flex-1">
          <h2 className="text-3xl font-light leading-tight mb-8">
            {currentQuestion.title}
          </h2>
          
          <textarea
            value={currentAnswer}
            onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
            placeholder={currentQuestion.placeholder}
            className="w-full h-40 bg-surface/50 border border-border text-text-main placeholder:text-text-muted/40 rounded-2xl p-5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm resize-none text-lg"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-6">
          <button 
            onClick={handleNext}
            disabled={currentAnswer.trim().length === 0}
            className="flex items-center justify-center gap-2 w-full bg-text-main text-background hover:bg-text-main/90 disabled:opacity-50 disabled:bg-surface disabled:text-text-muted font-medium py-4 rounded-xl transition-all shadow-md group"
          >
            {isLastStep ? (
              <>
                Let's Go
                <Check size={18} />
              </>
            ) : (
              <>
                Next
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          {/* Skip button for non-critical questions (optional) */}
          <button 
            onClick={handleNext}
            className="w-full text-center py-4 mt-2 text-sm text-text-muted hover:text-text-main transition-colors font-medium"
          >
            Skip this question
          </button>
        </div>
      </div>
      
    </div>
  );
}
