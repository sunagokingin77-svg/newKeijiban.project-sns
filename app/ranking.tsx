import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
// 必要な機能をすべてインポート
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter 
} from 'firebase/firestore'; 
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RankingScreen() {
  const router = useRouter();
  const { p } = useLocalSearchParams(); // indexから渡された期間 (1h, 1d, 1w, 1m)
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null); // 次のページを読み込むための目印
  const [isEnd, setIsEnd] = useState(false); // 全データ読み込み完了フラグ

  const PAGE_SIZE = 10; // 1ページあたりの表示件数

  // ランキングデータ取得関数
  const fetchRanking = async (isNextPage = false) => {
    if (loading || (isNextPage && isEnd)) return;
    setLoading(true);

    const now = new Date();
    let startTime = new Date();
    if (p === '1h') startTime.setHours(now.getHours() - 1);
    if (p === '1d') startTime.setDate(now.getDate() - 1);
    if (p === '1w') startTime.setDate(now.getDate() - 7);
    if (p === '1m') startTime.setMonth(now.getMonth() - 1);

    try {
      let q;
      if (isNextPage && lastDoc) {
        // 次の10件を取得（startAfterを使用）
        q = query(
          collection(db, 'posts'),
          where('createdAt', '>=', startTime),
          where('deleted', '!=', true),
          orderBy('deleted'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc), // 前回の最後のデータから開始
          limit(PAGE_SIZE)
        );
      } else {
        // 最初の10件を取得
        q = query(
          collection(db, 'posts'),
          where('createdAt', '>=', startTime),
          where('deleted', '!=', true),
          orderBy('deleted'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        if (isNextPage) setIsEnd(true);
        setLoading(false);
        return;
      }

      const newData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // A案：累計いいね順でソート（小規模ならJS側でソートするのが確実）
      const sortedData = newData.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));

      if (isNextPage) {
        setPosts([...posts, ...sortedData]);
      } else {
        setPosts(sortedData);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < PAGE_SIZE) setIsEnd(true);

    } catch (error) {
      console.error("Ranking Fetch Error:", error);
      // ここで FirebaseError が出たら、コンソールのURLをクリックしてインデックスを作成！
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [p]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color="#007AFF" />
          <Text style={styles.backText}> 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {p === '1h' ? '1時間' : p === '1d' ? '24時間' : p === '1w' ? '週間' : '月間'}
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {posts.map((post, index) => (
          <View key={post.id} style={styles.rankCard}>
            <View style={[styles.rankBadge, index < 3 && styles.topRank]}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.postText}>{post.text}</Text>
              <View style={styles.footer}>
                <Text style={styles.author}>👤 {post.userName || '名無し'}</Text>
                <Text style={styles.likes}>❤️ {post.likes || 0}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* 読み込みボタン */}
        {!isEnd && (
          <TouchableOpacity 
            style={styles.loadMoreButton} 
            onPress={() => fetchRanking(true)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.loadMoreText}>もっと見る (次の10件)</Text>
            )}
          </TouchableOpacity>
        )}

        {isEnd && posts.length > 0 && (
          <Text style={styles.endText}>すべてのランキングを表示しました</Text>
        )}
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 40 : 15 
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#007AFF', fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginRight: 40 },
  list: { flex: 1, padding: 10 },
  rankCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    marginBottom: 10, 
    borderRadius: 12, 
    padding: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankBadge: { 
    width: 30, 
    height: 30, 
    backgroundColor: '#bbb', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  topRank: { backgroundColor: '#FFD700' }, // 1~3位はゴールド
  rankNumber: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1 },
  postText: { fontSize: 15, color: '#333', marginBottom: 8, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12, color: '#888' },
  likes: { fontSize: 14, color: '#e91e63', fontWeight: 'bold' },
  loadMoreButton: { 
    padding: 15, 
    backgroundColor: '#f0f7ff', 
    borderRadius: 10, 
    alignItems: 'center', 
    marginVertical: 20 
  },
  loadMoreText: { color: '#007AFF', fontWeight: 'bold' },
  endText: { textAlign: 'center', color: '#bbb', marginVertical: 20, fontSize: 12 },
});