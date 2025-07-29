import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/modules/home/views/HomeView.vue'
import TestsView from '@/modules/tests/views/TestsView.vue'
import testRoutes from '@/modules/tests/routes'

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView
	},
	{
		path: '/tests',
		name: 'tests',
		component: TestsView
	},
	...testRoutes
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

export default router
