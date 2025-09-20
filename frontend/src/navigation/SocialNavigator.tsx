/**
 * Social Navigator
 * Navigation stack for social features
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeProvider';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { PostDetailScreen } from '../screens/social/PostDetailScreen';
import { UserProfileScreen } from '../screens/social/UserProfileScreen';
import { CreatePostModal } from '../components/social/CreatePostModal';

export type SocialStackParamList = {
  SocialFeed: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  CreatePost: undefined;
};

const Stack = createStackNavigator<SocialStackParamList>();

export const SocialNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.charcoal,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.onyx,
        },
        headerTintColor: theme.colors.alabaster,
        headerTitleStyle: {
          fontFamily: 'Lora-SemiBold',
          fontSize: 18,
          color: theme.colors.alabaster,
        },
        cardStyle: {
          backgroundColor: theme.colors.onyx,
        },
      }}
    >
      <Stack.Screen
        name="SocialFeed"
        component={SocialFeedScreen}
        options={{
          title: 'Community',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          title: 'Post',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostModal}
        options={{
          presentation: 'modal',
          title: 'New Post',
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
};
