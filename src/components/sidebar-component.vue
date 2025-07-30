<template>
	<Sidebar v-bind="props">
		<SidebarContent>
			<SidebarGroup v-for="item in data.nav" :key="item.title">
				<SidebarGroupLabel>{{ item.title }}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem v-for="childItem in item.items" :key="childItem.title">
							<SidebarMenuButton as-child :is-active="isItemActive(childItem.test)"
								@click="emitSelection(item.title, item.page, childItem.title)">
								<RouterLink :to="{ name: 'tests', params: { test: childItem.test } }">
									{{ childItem.title }}
								</RouterLink>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
		<SidebarRail />
	</Sidebar>
</template>

<script setup lang="ts">
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	type SidebarProps,
	SidebarRail,
} from '@/components/ui/sidebar'
import { useRoute } from 'vue-router'

export type NavigationMenuLocation = {
	category: {
		title: string,
		page: string
	},
	test: {
		title: string,
	}
}

const props = defineProps<SidebarProps>()
const emit = defineEmits<{
	(e: 'select', value: NavigationMenuLocation): void
}>()

const route = useRoute()

const isItemActive = (testParam: string) => {
	return route.name === 'tests' && route.params.test === testParam
}

const emitSelection = (categoryTitle: string, categoryPage: string, testTitle: string) => {
	emit('select', {
		category: {
			title: categoryTitle,
			page: categoryPage
		},
		test: {
			title: testTitle,
		}
	})
}

const data = {
	nav: [
		{
			title: 'Wallet to Wallet Transfers',
			page: '#',
			items: [
				{
					title: 'tz1 and tz1 Address',
					test: 'transfer',
				},
				// {
				// 	title: 'KT1 and tz1 Address',
				// 	test: '#',
				// },
				// {
				// 	title: 'KT1 and KT1 Address',
				// 	test: '#',
				// },
			],
		},
		{
			title: 'Smart Contracts',
			page: '#',
			items: [
				{
					title: 'Counter Contract',
					test: '#',
				},
			],
		},
	],
}
</script>
