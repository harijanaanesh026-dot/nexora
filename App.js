import React, { useState } from 'react';
import { Text, View, Button, TextInput, StyleSheet, SafeAreaView } from 'react-native';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [profile, setProfile] = useState({name: '', goal: '', skills: ''});

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Nexora ✨</Text>
        <Text style={styles.subtitle}>AI Match Your Future</Text>
        <View style={styles.button}>
          <Button title="Start Building" onPress={() => setScreen('profile')} color="white" />
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'profile') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Smart Profile</Text>
        <TextInput style={styles.input} placeholder="Nenu evarini? Ex: Developer" onChangeText={(t) => setProfile({...profile, name:t})} />
        <TextInput style={styles.input} placeholder="Naa Goal enti? Ex: 6 months lo SaaS" onChangeText={(t) => setProfile({...profile, goal:t})} />
        <TextInput style={styles.input} placeholder="Nenu em nerpinchagalanu?" onChangeText={(t) => setProfile({...profile, skills:t})} />
        <View style={styles.button}>
          <Button title="AI Match Chudu" onPress={() => setScreen('match')} color="white" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI Match Your Future 🤖</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Priya - UI Designer</Text>
        <Text style={styles.cardText}>Goal: SaaS Build cheyali</Text>
        <Text style={styles.aiText}>AI: Mee goals match avthunnayi!</Text>
        <View style={styles.button}>
          <Button title="Connect" onPress={() => alert('Connection Request Sent!')} color="white" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A23', padding: 20 },
  title: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#A855F7', marginBottom: 30 },
  input: { width: '100%', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 15, color:'black' },
  card: { backgroundColor: '#1E1E3F', padding: 20, borderRadius: 12, width: '100%' },
  cardText: { color: 'white', fontSize: 16, marginBottom: 5 },
  aiText: { color: '#A855F7', fontSize: 14, marginBottom: 15 },
  button: { backgroundColor: '#A855F7', borderRadius: 8, width: '100%', marginTop: 10, padding: 5 }
});