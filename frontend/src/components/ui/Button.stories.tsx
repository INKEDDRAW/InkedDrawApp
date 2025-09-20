/**
 * Button Storybook Stories
 * Demonstrates all Button component variants and states
 */

import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { ThemeProvider } from '../../theme/ThemeProvider';

const ButtonWithTheme = (props: any) => (
  <ThemeProvider>
    <View style={{ padding: 20, backgroundColor: '#121212' }}>
      <Button {...props} />
    </View>
  </ThemeProvider>
);

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: ButtonWithTheme,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
  args: {
    title: 'Button',
    onPress: () => console.log('Button pressed'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    title: 'Disabled Button',
    variant: 'primary',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Button',
    variant: 'primary',
    loading: true,
  },
};

export const SecondaryDisabled: Story = {
  args: {
    title: 'Disabled Secondary',
    variant: 'secondary',
    disabled: true,
  },
};
