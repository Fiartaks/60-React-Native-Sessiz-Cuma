import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import PushNotification from 'react-native-push-notification';

const App = () => {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [message, setMessage] = useState('');
  const [city, setCity] = useState(''); // Şehir adı durumu

  useEffect(() => {
    requestLocationPermission();
    requestExactAlarmPermission(); // Alarm izni isteme
    requestModifyAudioSettingsPermission(); // Ses ayarlarını değiştirme izni isteme
    createNotificationChannel();
  }, []);

  // Alarm izni isteme
  const requestExactAlarmPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SCHEDULE_EXACT_ALARM,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Alarm izni verildi.');
      } else {
        console.log('Alarm izni reddedildi.');
      }
    }
  };

  // Ses ayarlarını değiştirme izni isteme
  const requestModifyAudioSettingsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Ses ayarlarını değiştirme izni verildi.');
      } else {
        console.log('Ses ayarlarını değiştirme izni reddedildi.');
      }
    }
  };

  // Konum izni isteme
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Konum izni verildi.');
        getLocation();
      } else {
        console.log('Konum izni reddedildi.');
      }
    } else {
      getLocation();
    }
  };

  // Kullanıcının konumunu al
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        fetchPrayerTimes(latitude, longitude); // Konum bilgilerini kullan
      },
      error => {
        console.log('Konum alma hatası:', error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  // Namaz vakitlerini API'den çek
  const fetchPrayerTimes = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=13`,
      );

      if (response.status === 200) {
        const {data} = response.data;
        setPrayerTimes(data.timings); // Gelen veriyi durum değişkenine ata
        scheduleNotifications(data.timings); // Bildirimleri planla
      } else {
        console.log('API Hatası:', response.statusText);
      }
    } catch (error) {
      console.log('Namaz vakitleri çekilirken hata:', error.message);
      console.log(
        'Hata Detayları:',
        error.response ? error.response.data : error,
      );
    }
  };

  // Bildirim kanalı oluştur
  const createNotificationChannel = () => {
    PushNotification.createChannel(
      {
        channelId: 'prayer-times',
        channelName: 'Prayer Times',
        channelDescription: 'Namaz vakitleri bildirim kanalı',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Kanal ${created ? 'oluşturuldu' : 'zaten var'}`),
    );
  };
  // Bildirim planla
  const scheduleNotifications = times => {
    const prayerTimeKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    prayerTimeKeys.forEach(key => {
      const prayerTime = times[key];

      if (prayerTime) {
        const prayerDate = new Date(
          `${new Date().toDateString()} ${prayerTime}`,
        ); // Bugünün tarihi ile birleştir

        PushNotification.localNotificationSchedule({
          channelId: 'prayer-times',
          message: `${key} namazı vakti geldi!`,
          date: prayerDate,
          allowWhileIdle: true,
        });
      }
    });
  };

  // Telefonu sessiz moda alma işlemi
  const setPhoneToSilent = async () => {
    try {
      if (Platform.OS === 'android') {
        // Ses ayarlarını sessiz moda alma işlemi
        // Örnek bir kod olacak
        // Örneğin bir güncel ses ayarını yaparak:
        // Bu sadece bir örnektir. Gerçek ses ayarı kodu, Android için
        // ayrı bir yönetim gerektirebilir.
      }
    } catch (error) {
      console.log('Sessiz moda alırken hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Namaz Vakitleri</Text>
      <TextInput
        style={styles.input}
        placeholder="Şehir Adını Girin"
        value={city}
        onChangeText={text => setCity(text)}
      />
      <Button
        title="Namaz Vakitlerini Al"
        onPress={() => {
          fetchPrayerTimes(city); // Şehir ismi ile API'den namaz vakitlerini çek
        }}
      />
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
