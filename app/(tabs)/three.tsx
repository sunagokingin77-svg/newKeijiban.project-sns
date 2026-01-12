import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import dynamic from 'next/dynamic';

// Firebase
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// 【重要】古い import MapComponent from '../MapComponent' はここには書きません

const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }}>
      <ActivityIndicator size="large" color="#ff4444" />
      <Text style={{ marginTop: 10, color: '#666' }}>地図を読み込み中...</Text>
    </View>
  )
});

const okinawaCenter: [number, number] = [26.48, 127.92];

export default function TabThreeScreen() {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (typeof window !== 'undefined') {
        const storageKey = u ? `likes_${u.uid}` : 'guest_likes';
        const savedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const unsubPosts = onSnapshot(q, (snapshot) => {
          const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          // 保存されたIDに一致するものだけを抽出
          const filtered = all.filter(p => savedIds.includes(p.id));
          setLikedPosts(filtered);
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });
        
        return () => unsubPosts();
      }
    });
    return () => unsubAuth();
  }, []);

  if (!isClient) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ 保存した巡礼ルート</Text>
      </View>

      <View style={styles.layout}>
        <ScrollView style={styles.leftColumn}>
          {loading ? (
            <ActivityIndicator size="large" color="#ff4444" style={{ marginTop: 50 }} />
          ) : likedPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="heart-o" size={50} color="#ddd" />
              <Text style={styles.emptyText}>保存されたルートはありません</Text>
            </View>
          ) : (
            likedPosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.userName}>{post.userName || '匿名'} さんの投稿</Text>
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                <Text style={styles.postText} numberOfLines={3}>{post.text}</Text>
                
                <TouchableOpacity 
                  onPress={() => {
                    const loc = post.locations?.[0];
                    if (loc) {
                        const coords: [number, number] = Array.isArray(loc) ? loc : [loc.lat, loc.lng];
                        setFlyTarget(coords);
                    }
                  }}
                  style={styles.jumpBtn}
                >
                  <FontAwesome name="map-marker" size={14} color="#fff" />
                  <Text style={styles.jumpBtnText}> 地図でルートを確認</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.rightColumn}>
          <MapComponent posts={likedPosts} flyTarget={flyTarget} okinawaCenter={okinawaCenter} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { height: 60, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ff4444' },
  layout: { flexDirection: 'row', flex: 1 },
  leftColumn: { flex: 1, padding: 15 },
  rightColumn: { flex: 1.5 },
  postCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userName: { fontSize: 11, color: '#999', marginBottom: 8 },
  postImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  postText: { fontSize: 14, color: '#333', lineHeight: 20 },
  jumpBtn: { flexDirection: 'row', marginTop: 12, padding: 12, backgroundColor: '#007AFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  jumpBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 5 },
  emptyContainer: { marginTop: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 15, fontSize: 16, color: '#999' }
});