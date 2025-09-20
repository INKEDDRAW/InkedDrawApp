/**
 * Sign In Screen
 * User authentication screen with email/password login
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

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onNavigateToSignUp }) => {
  const theme = useInkedTheme();
  const { signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsSubmitting(true);
      await signIn(data.email, data.password);
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'Please check your credentials and try again.',
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
    signUpPrompt: {
      textAlign: 'center',
      marginTop: theme.semanticSpacing.lg,
    },
    signUpButton: {
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
          <H1 style={styles.header}>Welcome Back</H1>
          <Body style={styles.subtitle}>
            Sign in to your Inked Draw account
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="password"
                />
              )}
            />

            <Button
              title={isSubmitting ? 'Signing In...' : 'Sign In'}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              disabled={loading || isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </Card>

        <Body style={styles.signUpPrompt}>
          Don't have an account?
        </Body>
        <Button
          title="Create Account"
          onPress={onNavigateToSignUp}
          variant="secondary"
          style={styles.signUpButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
