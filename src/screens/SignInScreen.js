import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import {
  BrandText,
  BodyText,
  Button,
  theme,
} from '../components';
import { useAuth } from '../contexts/AuthContext';

const SignInScreen = ({ onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, error, clearError } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear any existing errors when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signIn(formData.email, formData.password);
      
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Please check your credentials and try again');
      }
      // If successful, the AuthContext will handle the state change
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <BrandText style={styles.title}>Welcome Back</BrandText>
          <BodyText style={styles.subtitle}>
            Access your executive account
          </BodyText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <BodyText style={styles.label}>Email Address</BodyText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <BodyText style={styles.label}>Password</BodyText>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error && (
            <BodyText style={styles.errorText}>{error}</BodyText>
          )}

          <Button
            title={isLoading ? "Signing In..." : "SIGN IN"}
            variant="primary"
            size="large"
            onPress={handleSignIn}
            disabled={isLoading}
            style={styles.signInButton}
          />

          <Button
            title="Forgot Password?"
            variant="ghost"
            size="small"
            onPress={() => Alert.alert('Coming Soon', 'Password reset functionality will be available soon.')}
            style={styles.forgotButton}
          />

          <Button
            title="Don't have an account? Sign Up"
            variant="ghost"
            size="medium"
            onPress={onBack}
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  signInButton: {
    marginTop: 20,
    marginBottom: 16,
  },
  forgotButton: {
    marginBottom: 8,
  },
  backButton: {
    marginTop: 8,
  },
});

export default SignInScreen;
