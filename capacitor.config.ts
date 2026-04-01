import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.imoutnow.app',
  appName: 'imoutnow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#39FF14',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    BackgroundGeolocation: {
      backgroundMessage: 'Checking for hot venues nearby…',
      backgroundTitle: 'imoutnow is watching for nearby spots',
    },
  },
}

export default config
