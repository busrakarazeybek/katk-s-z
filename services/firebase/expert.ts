import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { ExpertPost, PostCategory } from '../../types';
import { CreatePostData } from '../../components/experts/CreatePostSheet';
import { uploadExpertPostImage } from './storage';
import { VerificationResult } from '../../components/experts/ArticleVerifier';

/**
 * Create expert post
 */
export const createExpertPost = async (
  userId: string,
  userName: string,
  userSpecialization: string,
  data: CreatePostData
): Promise<string> => {
  try {
    let imageUrl: string | undefined;

    // Upload image if provided
    if (data.imageUri) {
      const tempPostId = `post_${Date.now()}`;
      imageUrl = await uploadExpertPostImage(data.imageUri, userId, tempPostId);
    }

    const postData = {
      authorId: userId,
      authorName: userName,
      authorSpecialization: userSpecialization,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      tags: data.tags,
      imageUrl: imageUrl || null,
      sources: data.sources,
      likes: 0,
      likedBy: [],
      comments: [],
      commentCount: 0,
      views: 0,
      published: data.published,
      createdAt: serverTimestamp(),
      ...(data.published && { publishedAt: serverTimestamp() }),
    };

    const docRef = await addDoc(collection(db, 'expertPosts'), postData);
    return docRef.id;
  } catch (error: any) {
    throw new Error('Post oluşturulamadı: ' + error.message);
  }
};

/**
 * Update expert post
 */
export const updateExpertPost = async (
  postId: string,
  updates: Partial<ExpertPost>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expertPosts', postId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('Post güncellenemedi: ' + error.message);
  }
};

/**
 * Delete expert post
 */
export const deleteExpertPost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'expertPosts', postId));
  } catch (error: any) {
    throw new Error('Post silinemedi: ' + error.message);
  }
};

/**
 * Like expert post
 */
export const likeExpertPost = async (
  postId: string,
  userId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expertPosts', postId), {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
  } catch (error: any) {
    throw new Error('Beğeni eklenemedi: ' + error.message);
  }
};

/**
 * Unlike expert post
 */
export const unlikeExpertPost = async (
  postId: string,
  userId: string
): Promise<void> => {
  try {
    const postRef = doc(db, 'expertPosts', postId);
    await updateDoc(postRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
  } catch (error: any) {
    throw new Error('Beğeni kaldırılamadı: ' + error.message);
  }
};

/**
 * Add comment to expert post
 */
export const addExpertPostComment = async (
  postId: string,
  userId: string,
  userName: string,
  text: string
): Promise<void> => {
  try {
    const comment = {
      id: Date.now().toString(),
      userId,
      userName,
      text,
      likes: 0,
      createdAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'expertPosts', postId), {
      comments: arrayUnion(comment),
      commentCount: increment(1),
    });
  } catch (error: any) {
    throw new Error('Yorum eklenemedi: ' + error.message);
  }
};

/**
 * Increment post views
 */
export const incrementPostViews = async (postId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expertPosts', postId), {
      views: increment(1),
    });
  } catch (error: any) {
    console.error('Error incrementing views:', error);
  }
};

/**
 * Verify academic article (simplified version)
 * In production, this would call external APIs
 */
export const verifyAcademicArticle = async (
  articleUrl: string
): Promise<VerificationResult> => {
  try {
    // Basic validation
    const supportedDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'scholar.google',
      'researchgate.net',
      'sciencedirect.com',
      'nature.com',
      'ncbi.nlm.nih.gov/pmc',
      'doi.org',
    ];

    const urlObj = new URL(articleUrl);
    const isSupported = supportedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (!isSupported) {
      return {
        valid: false,
        error: 'Desteklenmeyen kaynak. Lütfen bilimsel bir veritabanından URL girin.',
      };
    }

    // In production, would call CrossRef API, PubMed API, etc.
    // For now, just validate URL format
    return {
      valid: true,
      title: 'Makale doğrulandı',
      journal: 'Academic Journal',
      year: new Date().getFullYear(),
    };
  } catch (error: any) {
    return {
      valid: false,
      error: 'Geçersiz URL formatı',
    };
  }
};

/**
 * Apply for expert role
 */
export const applyForExpertRole = async (
  userId: string,
  email: string,
  fullName: string,
  articleUrl: string,
  specialization: string,
  institution: string,
  additionalInfo?: string
): Promise<void> => {
  try {
    // Verify article first
    const verification = await verifyAcademicArticle(articleUrl);

    if (!verification.valid) {
      throw new Error(verification.error || 'Makale doğrulanamadı');
    }

    const application = {
      userId,
      email,
      fullName,
      articleUrl,
      specialization,
      institution,
      additionalInfo: additionalInfo || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'expertApplications'), application);
  } catch (error: any) {
    throw new Error('Başvuru gönderilemedi: ' + error.message);
  }
};

/**
 * Publish draft post
 */
export const publishPost = async (postId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expertPosts', postId), {
      published: true,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('Post yayınlanamadı: ' + error.message);
  }
};

/**
 * Unpublish post (make draft)
 */
export const unpublishPost = async (postId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expertPosts', postId), {
      published: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('Post taslağa alınamadı: ' + error.message);
  }
};

/**
 * Get all published expert posts
 */
export const getExpertPosts = async (
  limitCount: number = 20,
  category?: PostCategory
): Promise<ExpertPost[]> => {
  try {
    const postsRef = collection(db, 'expertPosts');
    let q = query(
      postsRef,
      where('published', '==', true),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );

    if (category) {
      q = query(
        postsRef,
        where('published', '==', true),
        where('category', '==', category),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts: ExpertPost[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ExpertPost);
    });

    return posts;
  } catch (error: any) {
    console.error('Error getting expert posts:', error);
    throw new Error('Postlar yüklenemedi: ' + error.message);
  }
};

/**
 * Get expert post by ID
 */
export const getExpertPostById = async (postId: string): Promise<ExpertPost | null> => {
  try {
    const postRef = doc(db, 'expertPosts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return null;
    }

    const data = postSnap.data();
    return {
      id: postSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      publishedAt: data.publishedAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as ExpertPost;
  } catch (error: any) {
    console.error('Error getting expert post:', error);
    throw new Error('Post yüklenemedi: ' + error.message);
  }
};

/**
 * Get posts by author
 */
export const getPostsByAuthor = async (
  authorId: string,
  includeUnpublished: boolean = false
): Promise<ExpertPost[]> => {
  try {
    const postsRef = collection(db, 'expertPosts');
    let q;

    if (includeUnpublished) {
      q = query(
        postsRef,
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        postsRef,
        where('authorId', '==', authorId),
        where('published', '==', true),
        orderBy('publishedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const posts: ExpertPost[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ExpertPost);
    });

    return posts;
  } catch (error: any) {
    console.error('Error getting posts by author:', error);
    throw new Error('Yazar postları yüklenemedi: ' + error.message);
  }
};

/**
 * Get trending posts (most likes in last 7 days)
 */
export const getTrendingPosts = async (limitCount: number = 10): Promise<ExpertPost[]> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const postsRef = collection(db, 'expertPosts');
    const q = query(
      postsRef,
      where('published', '==', true),
      where('publishedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('publishedAt', 'desc'),
      orderBy('likes', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts: ExpertPost[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ExpertPost);
    });

    // Sort by likes (since Firestore doesn't support multiple orderBy well)
    posts.sort((a, b) => b.likes - a.likes);

    return posts;
  } catch (error: any) {
    console.error('Error getting trending posts:', error);
    throw new Error('Trend postlar yüklenemedi: ' + error.message);
  }
};
