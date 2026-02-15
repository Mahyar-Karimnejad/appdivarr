import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaWrapper } from '@/src/components/common/SafeAreaWrapper';

export default function ModalScreen() {
  return (
    <SafeAreaWrapper edges={['top', 'bottom']} style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title">مودال</ThemedText>
        <ThemedText>این یک صفحه مودال است</ThemedText>
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">بازگشت به خانه</ThemedText>
        </Link>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
