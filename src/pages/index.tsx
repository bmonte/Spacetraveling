import { useState } from 'react';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { FiUser, FiCalendar } from 'react-icons/fi';

import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [results, setResults] = useState(() => {
    return postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });
  });

  function handleShowMorePosts(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setResults(oldPosts => [...oldPosts, ...data.results]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={styles.postList}>
          {results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <footer>
                  <span>
                    <FiCalendar size={20} />
                    <time>{post.first_publication_date}</time>
                  </span>

                  <span>
                    <FiUser size={20} />
                    <p>{post.data.author}</p>
                  </span>
                </footer>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              type="button"
              className={styles.showMore}
              onClick={handleShowMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 5,
    }
  );

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 10,
  };
};
