import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExpensesProvider } from './src/storage/ExpensesContext';
import { PaymentMethodsProvider } from './src/storage/PaymentMethodsContext';
import { LanguageProvider, useLanguage } from './src/storage/LanguageContext';
import { VacationsProvider } from './src/storage/VacationsContext';
import { ExchangeRatesProvider } from './src/storage/ExchangeRatesContext';
import { ExpenseGroupingProvider } from './src/storage/ExpenseGroupingContext';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import ManageExpensesScreen from './src/screens/ManageExpensesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VacationFormScreen from './src/screens/VacationFormScreen';
import SplashScreen from './src/screens/SplashScreen';

const RootStack = createNativeStackNavigator();

// Long enough for the splash's own wordmark to actually be seen in the
// user's saved language (it updates the instant `loading` clears) rather
// than the screen just flashing past before anyone can read it.
const MIN_SPLASH_MS = 500;

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
        <RootStack.Screen name="Expenses" component={ManageExpensesScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <RootStack.Screen
          name="VacationForm"
          component={VacationFormScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            contentStyle: { backgroundColor: 'transparent' },
          }}
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
                <ExpenseGroupingProvider>
                  <AppGate />
                </ExpenseGroupingProvider>
              </ExpensesProvider>
            </PaymentMethodsProvider>
          </ExchangeRatesProvider>
        </VacationsProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
