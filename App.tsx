import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { ExpensesProvider } from './src/storage/ExpensesContext';
import { PaymentMethodsProvider } from './src/storage/PaymentMethodsContext';
import { LanguageProvider, useLanguage } from './src/storage/LanguageContext';
import { VacationsProvider } from './src/storage/VacationsContext';
import { ExchangeRatesProvider } from './src/storage/ExchangeRatesContext';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import ManageExpensesScreen from './src/screens/ManageExpensesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VacationFormScreen from './src/screens/VacationFormScreen';
import ExpenseSplitScreen from './src/screens/ExpenseSplitScreen';
import SplashScreen from './src/screens/SplashScreen';

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

// Long enough for the splash's own wordmark to actually be seen in the
// user's saved language (it updates the instant `loading` clears) rather
// than the screen just flashing past before anyone can read it.
const MIN_SPLASH_MS = 2500;

function AppGate() {
  const { loading } = useLanguage();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Wait for the persisted language to load before rendering the real app — the
  // whole app's layout direction (LTR/RTL) depends on it, so rendering early would
  // flash English/LTR and then jump to the real language, instead of just splashing.
  if (loading || !minSplashDone) {
    return <SplashScreen />;
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
          name="VacationForm"
          component={VacationFormScreen}
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
        <VacationsProvider>
          <ExchangeRatesProvider>
            <PaymentMethodsProvider>
              <ExpensesProvider>
                <AppGate />
              </ExpensesProvider>
            </PaymentMethodsProvider>
          </ExchangeRatesProvider>
        </VacationsProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
