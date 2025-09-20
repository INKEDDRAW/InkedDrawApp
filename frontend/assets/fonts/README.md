# Fonts Directory

This directory should contain the custom fonts for the Inked Draw application.

## Required Fonts

### Lora (Heading Font)
Download from Google Fonts: https://fonts.google.com/specimen/Lora

Required files:
- `Lora-Regular.ttf`
- `Lora-Medium.ttf`
- `Lora-SemiBold.ttf`
- `Lora-Bold.ttf`

### Inter (Body Font)
Download from Google Fonts: https://fonts.google.com/specimen/Inter

Required files:
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

## Installation Instructions

1. Download the font files from Google Fonts
2. Place the `.ttf` files in this directory
3. The fonts will be automatically loaded by the app using expo-font

## Usage

The fonts are configured in `src/theme/fonts.ts` and used throughout the design system via the typography components in `src/components/ui/Typography.tsx`.
