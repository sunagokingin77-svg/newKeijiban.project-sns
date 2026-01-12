import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import dynamic from 'next/dynamic';

// Firebase
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, limit, updateDoc, doc, increment } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// 【重要】古い import MapComponent はここには書かないでください

const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => (
    <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 10, color: '#666' }}>地図を読み込み中...</Text>
    </View>
  )
});

const okinawaCenter: [number, number] = [26.48, 127.92];
const PAGE_SIZE = 10;

export default function TabOneScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [rankPeriod, setRankPeriod] = useState<'1h' | '1d' | '1w' | '1m'>('1d');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null); 

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (typeof window !== 'undefined') {
        const storageKey = u ? `likes_${u.uid}` : 'guest_likes';
        const saved = localStorage.getItem(storageKey);
        setLikedPosts(saved ? JSON.parse(saved) : []);
      }
    });

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribePosts = onSnapshot(q, (s) => {
      setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribeAuth(); unsubscribePosts(); };
  }, []);

  const handleLikeToggle = async (postId: string) => {
    const isLiked = likedPosts.includes(postId);
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, { likes: increment(isLiked ? -1 : 1) });
      const newLikes = isLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
      setLikedPosts(newLikes);
      if (typeof window !== 'undefined') {
        const storageKey = user ? `likes_${user.uid}` : 'guest_likes';
        localStorage.setItem(storageKey, JSON.stringify(newLikes));
      }
    } catch (e) { console.error(e); }
  };

  const getRankedData = () => {
    const now = Date.now();
    const periods = { '1h': 3600000, '1d': 86400000, '1w': 604800000, '1m': 2592000000 };
    return posts
      .filter(p => p.createdAt?.toMillis() > (now - periods[rankPeriod]))
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={!!fullImage} transparent={true}>
        <TouchableOpacity style={styles.fullImageOverlay} onPress={() => setFullImage(null)}>
          <Image source={{ uri: fullImage || '' }} style={styles.fullImage} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      <View style={styles.layout}>
        <ScrollView style={styles.leftColumn}>
          <Text style={styles.sectionTitle}>🏆 人気の巡礼ルート</Text>
          <View style={styles.tabBar}>
            {(['1h', '1d', '1w', '1m'] as const).map(p => (
              <TouchableOpacity key={p} onPress={() => setRankPeriod(p)} style={[styles.tabItem, rankPeriod === p && styles.tabItemActive]}>
                <Text style={[styles.tabText, rankPeriod === p && styles.tabTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {getRankedData().map((post, idx) => (
            <View key={post.id} style={styles.rankCard}>
              <Text style={styles.rankNumber}>{idx + 1}</Text>
              <Text style={styles.rankText} numberOfLines={1}>{post.text}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>📝 最新の投稿</Text>
          {posts.map(post => (
            <View key={post.id} style={styles.postCard}>
              {post.imageUrl && (
                <TouchableOpacity onPress={() => setFullImage(post.imageUrl)}>
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                </TouchableOpacity>
              )}
              <Text style={styles.postText}>{post.text}</Text>
              <View style={styles.postFooter}>
                <TouchableOpacity onPress={() => handleLikeToggle(post.id)}>
                  <FontAwesome name={likedPosts.includes(post.id) ? "heart" : "heart-o"} size={20} color="#ff4444" />
                  <Text style={{fontSize: 10, textAlign: 'center'}}>{post.likes || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const loc = post.locations?.[0];
                  if (loc) setFlyTarget([loc.lat, loc.lng]);
                }}>
                  <Text style={{color:'#007AFF', fontWeight: 'bold'}}>📍 地図へジャンプ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.rightColumn}>
          <MapComponent posts={posts} flyTarget={flyTarget} okinawaCenter={okinawaCenter} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  layout: { flexDirection: 'row', flex: 1 },
  leftColumn: { flex: 1, padding: 15 },
  rightColumn: { flex: 1.5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  tabBar: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#eee', borderRadius: 8, padding: 2 },
  tabItem: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  tabItemActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 10, color: '#666' },
  tabTextActive: { color: '#000', fontWeight: 'bold' },
  rankCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  rankNumber: { fontSize: 14, fontWeight: 'bold', color: '#ff9500', width: 25 },
  rankText: { flex: 1, fontSize: 13 },
  postCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 15, elevation: 2 },
  postImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10 },
  postText: { fontSize: 14, color: '#333' },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '80%' }
});