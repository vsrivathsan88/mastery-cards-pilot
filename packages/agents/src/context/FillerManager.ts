export enum FillerType {
  THINKING = 'thinking',
  ENCOURAGING = 'encouraging',
  PROBING = 'probing',
  ACKNOWLEDGING = 'acknowledging',
  NEUTRAL = 'neutral',
}

export interface FillerOptions {
  type?: FillerType;
  studentName?: string;
  emotionalState?: 'engaged' | 'confused' | 'frustrated' | 'excited';
}

export class FillerManager {
  private fillers: Record<FillerType, string[]>;

  constructor() {
    this.fillers = {
      [FillerType.THINKING]: [
        "Hmm, let me think about that for a moment...",
        "Interesting! Give me just a second to consider this...",
        "Let me think through your answer...",
        "That's a good point. Let me reflect on that...",
        "I want to make sure I understand your thinking...",
      ],
      [FillerType.ENCOURAGING]: [
        "I love how you're thinking about this!",
        "You're really engaging with this problem!",
        "Great approach! Let me think about what you said...",
        "I can see you're putting a lot of thought into this!",
        "Wonderful! Give me a moment to process that...",
      ],
      [FillerType.PROBING]: [
        "Interesting! Can you tell me more about your thinking?",
        "Hmm, I'd love to understand your reasoning better...",
        "That's an interesting perspective. Help me see what you're seeing...",
        "I'm curious about how you arrived at that...",
        "Tell me more - what's making you think that way?",
      ],
      [FillerType.ACKNOWLEDGING]: [
        "I hear you. Let me think about that...",
        "Okay, I'm following your reasoning...",
        "I see what you're saying. Give me just a moment...",
        "Alright, I'm processing what you shared...",
        "Got it. Let me consider this carefully...",
      ],
      [FillerType.NEUTRAL]: [
        "One moment please...",
        "Just a second...",
        "Give me a moment...",
        "Let me think...",
        "Hmm...",
      ],
    };
  }

  public getFiller(options: FillerOptions = {}): string {
    const { type, emotionalState } = options;

    // Choose filler type based on emotional state if not specified
    let fillerType = type;
    if (!fillerType && emotionalState) {
      fillerType = this.selectTypeByEmotion(emotionalState);
    }
    if (!fillerType) {
      fillerType = FillerType.THINKING;
    }

    // Get random filler from the type
    const fillerArray = this.fillers[fillerType];
    const randomIndex = Math.floor(Math.random() * fillerArray.length);
    return fillerArray[randomIndex];
  }

  public getThinkingSound(): string {
    // These are non-verbal thinking sounds that can be used
    // Could be used with TTS or as text markers
    const sounds = ["Hmm...", "Uhh...", "Let's see...", "Okay..."];
    const randomIndex = Math.floor(Math.random() * sounds.length);
    return sounds[randomIndex];
  }

  public getContextualFiller(
    isMisconceptionSuspected: boolean,
    isEmotionallyCharged: boolean,
    isCorrectAnswer: boolean
  ): string {
    if (isCorrectAnswer) {
      return this.getFiller({ type: FillerType.ENCOURAGING });
    }

    if (isMisconceptionSuspected) {
      return this.getFiller({ type: FillerType.PROBING });
    }

    if (isEmotionallyCharged) {
      return this.getFiller({ type: FillerType.ACKNOWLEDGING });
    }

    return this.getFiller({ type: FillerType.THINKING });
  }

  private selectTypeByEmotion(
    emotionalState: 'engaged' | 'confused' | 'frustrated' | 'excited'
  ): FillerType {
    switch (emotionalState) {
      case 'excited':
      case 'engaged':
        return FillerType.ENCOURAGING;
      case 'confused':
        return FillerType.PROBING;
      case 'frustrated':
        return FillerType.ACKNOWLEDGING;
      default:
        return FillerType.THINKING;
    }
  }

  public addCustomFiller(type: FillerType, filler: string): void {
    this.fillers[type].push(filler);
  }

  public getFillersByType(type: FillerType): string[] {
    return [...this.fillers[type]];
  }
}
