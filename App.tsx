import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { ExpensesProvider } from './src/storage/ExpensesContext';
import { PaymentMethodsProvider } from './src/storage/PaymentMethodsContext';
import { LanguageProvider, useLanguage } from './src/storage/LanguageContext';
import { GroupsProvider } from './src/storage/GroupsContext';
import { ExchangeRatesProvider } from './src/storage/ExchangeRatesContext';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import ManageExpensesScreen from './src/screens/ManageExpensesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GroupFormScreen from './src/screens/GroupFormScreen';
import ExpenseSplitScreen from './src/screens/ExpenseSplitScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function MainTabs() {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  const expensesTab = (
    <Tab.Screen
      key="Expenses"
      name="Expenses"
      component={ManageExpensesScreen}
      options={{ tabBarLabel: t.tabs.expenses }}
    />
  );
  const settingsTab = (
    <Tab.Screen
      key="Settings"
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: t.tabs.settings }}
    />
  );

  return (
    <Tab.Navigator
      initialRouteName="Expenses"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'Expenses' ? 'list' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* Tabs are declared left-to-right; mirror the order in RTL so "Expenses" —
          the app's primary/first tab — stays on the reading-order-first side. */}
      {isRTL ? [settingsTab, expensesTab] : [expensesTab, settingsTab]}
    </Tab.Navigator>
  );
}

function AppGate() {
  const { loading } = useLanguage();

  // Wait for the persisted language to load before rendering anything — the whole
  // app's layout direction (LTR/RTL) depends on it, so rendering early would flash
  // English/LTR and then jump to the real language, instead of just loading blank.
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return <AppNavigator />;
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={MainTabs} />
        <RootStack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ presentation: 'modal' }}
        />
        <RootStack.Screen
          name="GroupForm"
          component={GroupFormScreen}
          options={{ presentation: 'modal' }}
        />
        <RootStack.Screen
          name="ExpenseSplit"
          component={ExpenseSplitScreen}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <GroupsProvider>
          <ExchangeRatesProvider>
            <PaymentMethodsProvider>
              <ExpensesProvider>
                <AppGate />
              </ExpensesProvider>
            </PaymentMethodsProvider>
          </ExchangeRatesProvider>
        </GroupsProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
