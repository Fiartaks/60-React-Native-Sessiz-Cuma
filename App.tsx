import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  TextInput, // Ensure TextInput is imported
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import PushNotification from 'react-native-push-notification';

const App = () => {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [message, setMessage] = useState('');
  const [city, setCity] = useState(''); // State to store city name

  useEffect(() => {
    createNotificationChannel();
  }, []);

  const fetchPrayerTimesByCity = async (cityName) => {
    console.log(`Fetching prayer times for city: ${cityName}`); // Debug log
    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?city=${cityName}&country=Turkey&method=13`,
      );

      if (response.status === 200) {
        const { data } = response.data;
        setPrayerTimes(data.timings);
        scheduleNotifications(data.timings);
        console.log('Prayer times fetched successfully:', data.timings); // Debug log
      } else {
        console.error('API Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error.message);
      console.error(
        'Error Details:',
        error.response ? error.response.data : error,
      );
    }
  };

  const createNotificationChannel = () => {
    PushNotification.createChannel(
      {
        channelId: 'prayer-times',
        channelName: 'Prayer Times',
        channelDescription: 'Namaz vakitleri bildirim kanalı',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel ${created ? 'created' : 'already exists'}`),
    );
  };

  const scheduleNotifications = (times) => {
    const prayerTimeKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    prayerTimeKeys.forEach((key) => {
      const prayerTime = times[key];
      
      if (prayerTime) {
        const prayerDate = new Date(
          `${new Date().toDateString()} ${prayerTime}`,
        );
        PushNotification.localNotificationSchedule({
          channelId: 'prayer-times',
          message: `${key} namazı vakti geldi!`,
          date: prayerDate,
          allowWhileIdle: true,
        });
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Namaz Vakitleri</Text>
      <TextInput
        style={styles.input}
        placeholder="Şehir Adını Girin"
        value={city}
        onChangeText={text => {
          console.log('City updated:', text); // Debug log
          setCity(text);
        }}
      />
      <Button title="Namaz Vakitlerini Al" onPress={() => {
        console.log('Button pressed, fetching prayer times.');
        fetchPrayerTimesByCity(city);
      }} />

      <Text style={styles.info}>
        {message || 'Namaz vakitleri yükleniyor...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: 200,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
});

export default App;