import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/modules/home/views/HomeView.vue'
import TestsView from '@/modules/tests/views/TestsView.vue'

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView
	},
	{
		path: '/tests/:test?',
		name: 'tests',
		component: TestsView
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

export default router
