#!/usr/bin/env python3
'''
Synthetic "photo-realistic" product review generator.

Generates a JSON corpus of open-ended reviews with varied length, sentiment,
topics, and common misspellings. Ideal for clustering demos.

Example:
    python review_generator.py -n 50 -o reviews.json
'''
from __future__ import annotations

import argparse
import json
import pathlib
import random
import textwrap
import uuid
from typing import List, Dict

PRODUCTS: List[str] = [
    'Bluetooth speaker',
    'Running shoes',
    'Espresso machine',
    'Beard trimmer',
    'Camping tent',
    'Cat toy',
    'Noise-cancelling headphones',
    'Smartwatch',
]

MISSPELLINGS: Dict[str, List[str]] = {
    'definitely': ['definately', 'definatly'],
    'disappointed': ['dissapointed', 'disapointed'],
    'because': ['becuase'],
    'quality': ['quallity', 'qualtiy'],
    'battery': ['batery'],
    'great': ['gret', 'graet'],
}

SHORT_POS = ['Love it!', 'Works great.', 'Fantastic buy.']
SHORT_NEG = ['Waste of money.', 'Broke fast.', 'Very dissapointed.']
SHORT_NEU = ['It\'s okay.', 'Fair enough.', 'Does the job.']

MEDIUM_POS_TEMPLATES = [
    'The {product} surprised me — the sound is {adj} and the build solid.',
    'Honestly, this {product} exceeded expectations. {extra}',
]
MEDIUM_NEG_TEMPLATES = [
    'Bought the {product} last month and already the {problem}.',
    'Sadly, I can\'t recommend the {product}: {problem}.',
]
MEDIUM_NEU_TEMPLATES = [
    'The {product} is fine overall; nothing more, nothing less.',
]

LONG_POS_TEMPLATES = [
    'I researched before ordering this {product} and it paid off. The {noun} is {adj}.',
]
LONG_NEG_TEMPLATES = [
    'I rarely leave reviews but this {product} forced me. {problem} appeared within days.',
]
LONG_NEU_TEMPLATES = [
    'After three months with the {product}, I\'m neutral. {problem} but still usable.',
]

ADJECTIVES = ['crystal-clear', 'top-notch', 'mediocre', 'solid']
NOUNS = ['finish', 'battery', 'interface']
PROBLEMS = ['battery drains overnight', 'app keeps crashing', 'zipper split']

def maybe_misspell(word: str, p: float = 0.12) -> str:
    if random.random() > p:
        return word
    lower = word.lower()
    if lower in MISSPELLINGS:
        bad = random.choice(MISSPELLINGS[lower])
        return bad.capitalize() if word[0].isupper() else bad
    if len(word) > 4:
        idx = random.randint(1, len(word) - 2)
        return word[:idx] + word[idx + 1 :]
    return word

def generate_review(product: str) -> str:
    length = random.choices(['short', 'medium', 'long'], [0.25, 0.5, 0.25])[0]
    sentiment = random.choices(['pos', 'neg', 'neu'], [0.4, 0.35, 0.25])[0]
    if length == 'short':
        pool = {'pos': SHORT_POS, 'neg': SHORT_NEG, 'neu': SHORT_NEU}[sentiment]
        text = random.choice(pool)
    elif length == 'medium':
        template = {
            'pos': random.choice(MEDIUM_POS_TEMPLATES),
            'neg': random.choice(MEDIUM_NEG_TEMPLATES),
            'neu': random.choice(MEDIUM_NEU_TEMPLATES),
        }[sentiment]
        text = template.format(
            product=product,
            adj=random.choice(ADJECTIVES),
            problem=random.choice(PROBLEMS),
            extra='Customer service replied within hours.',
        )
    else:
        template = {
            'pos': random.choice(LONG_POS_TEMPLATES),
            'neg': random.choice(LONG_NEG_TEMPLATES),
            'neu': random.choice(LONG_NEU_TEMPLATES),
        }[sentiment]
        text = template.format(
            product=product,
            adj=random.choice(ADJECTIVES),
            noun=random.choice(NOUNS),
            problem=random.choice(PROBLEMS),
        )
    return ' '.join(maybe_misspell(w) for w in text.split())

def main(count: int, output: pathlib.Path) -> None:
    reviews = [
        {
            'id': uuid.uuid4().hex,
            'product': random.choice(PRODUCTS),
            'review': generate_review(random.choice(PRODUCTS)),
        }
        for _ in range(count)
    ]
    output.write_text(json.dumps(reviews, ensure_ascii=False, indent=2))
    print(f'Generated {count} reviews → {output}')
    print('-' * 80)
    for sample in reviews[:5]:
        print(textwrap.fill(f"{sample['product']}: {sample['review']}", width=72))
        print('-' * 80)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--count', type=int, default=50)
    parser.add_argument('-o', '--output', type=pathlib.Path, default='reviews.json')
    args = parser.parse_args()
    main(args.count, args.output)
