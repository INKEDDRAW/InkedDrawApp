/**
 * Sign Up Screen
 * User registration screen with email/password and profile setup
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useInkedTheme } from '../../theme/ThemeProvider';
import { Button, Input, H1, Body, Card } from '../../components/ui';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn }) => {
  const theme = useInkedTheme();
  const { signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      displayName: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      await signUp(data.email, data.password, data.username, data.displayName);
      Alert.alert(
        'Account Created',
        'Welcome to Inked Draw! Your account has been created successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'Please check your information and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: theme.semanticSpacing.screenPadding,
    },
    card: {
      marginBottom: theme.semanticSpacing.lg,
    },
    header: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.md,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.xl,
    },
    form: {
      gap: theme.semanticSpacing.md,
    },
    submitButton: {
      marginTop: theme.semanticSpacing.md,
    },
    signInPrompt: {
      textAlign: 'center',
      marginTop: theme.semanticSpacing.lg,
    },
    signInButton: {
      marginTop: theme.semanticSpacing.sm,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <H1 style={styles.header}>Join Inked Draw</H1>
          <Body style={styles.subtitle}>
            Create your account to start your connoisseur journey
          </Body>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="Choose a unique username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              )}
            />

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Display Name"
                  placeholder="How should others see your name?"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  autoComplete="name"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a strong password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />

            <Button
              title={isSubmitting ? 'Creating Account...' : 'Create Account'}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              disabled={loading || isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </Card>

        <Body style={styles.signInPrompt}>
          Already have an account?
        </Body>
        <Button
          title="Sign In"
          onPress={onNavigateToSignIn}
          variant="secondary"
          style={styles.signInButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
