import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './ui/App.tsx';
import {lazy,Suspense} from 'react';
const VideoStudio=lazy(()=>import('./lessons/VideoStudio.tsx'));
import './ui/style.css';
import './ui/polish.css';
import './ui/workspace.css';
import './ui/p08.css';
createRoot(document.getElementById('root')!).render(import.meta.env.DEV&&new URLSearchParams(location.search).has('video-studio')?<Suspense fallback={<p>Loading video studio…</p>}><VideoStudio/></Suspense>:<App/>);
import './ui/p09.css';

import './ui/p10.css';
