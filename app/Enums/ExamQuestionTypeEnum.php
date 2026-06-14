<?php

namespace App\Enums;

enum ExamQuestionTypeEnum: string
{
    case MULTIPLE_CHOICE = 'multiple_choice';
    case MATCHING = 'matching';
    case TRUE_FALSE = 'true_false';
    case SHORT_ANSWER = 'short_answer';
    case FILL_IN_THE_BLANK = 'fill_in_the_blank';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return array
     */
    public static function getTranslatedOptions($lang = null): array
    {
        $options = [];
        foreach (self::cases() as $role) {
            $options[$role->value] = $role->getName($lang);
        }

        return $options;
    }

    /**
     * @return string
     */
    public function getName($lang = null): string
    {
        return __('exam.'.$this->value, [], $lang);
    }
}
