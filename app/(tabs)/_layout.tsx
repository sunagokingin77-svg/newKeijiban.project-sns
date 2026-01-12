import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '掲示板',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: '新規投稿',
          tabBarIcon: ({ color }) => <FontAwesome name="plus-square" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'お気に入り',
          tabBarIcon: ({ color }) => <FontAwesome name="heart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}