import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';

export default function ModalScreen() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // コンポーネントがマウントされたら実行（ブラウザ環境確定）
    setIsClient(true);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ヘルプ / 使い方</Text>
      <View style={styles.separator} />
      
      <View style={styles.helpSection}>
        <Text style={styles.helpText}>🚩 **投稿方法**</Text>
        <Text style={styles.desc}>「新規投稿」タブから、地図をタップして地点を追加してください。地点名をタップすると好きな名前に変更できます。</Text>
        
        <Text style={[styles.helpText, {marginTop: 20}]}>❤️ **お気に入り**</Text>
        <Text style={styles.desc}>掲示板のハートマークを押すと「保存済み」タブにルートが同期されます。</Text>
      </View>

      {/* ブラウザ環境でのみStatusBarを表示（SSRエラー防止） */}
      {isClient && <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
  },
  helpSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  desc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});