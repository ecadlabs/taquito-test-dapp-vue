<template>
	<Sidebar>
		<SidebarContent>
			<SidebarGroup v-for="item in data.nav" :key="item.title">
				<SidebarGroupLabel>{{ item.title }}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem v-for="childItem in item.items" :key="childItem.title">
							<SidebarMenuButton as-child :is-active="isItemActive(childItem.test)">
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
	SidebarRail,
} from '@/components/ui/sidebar'
import { useRoute } from 'vue-router'
import { getAllCategories, getTestsByCategory } from '@/modules/tests/tests'
import { computed } from 'vue'

const route = useRoute()

const isItemActive = (testParam: string) => {
	return route.name === 'tests' && route.params.test === testParam
}

const data = computed(() => {
	const categories = getAllCategories()

	return {
		nav: categories.map(category => {
			const testsInCategory = getTestsByCategory(category)
			return {
				title: category.charAt(0).toUpperCase() + category.slice(1),
				items: testsInCategory.map(test => ({
					title: test.title,
					test: test.id,
				}))
			}
		})
	}
})
</script>
