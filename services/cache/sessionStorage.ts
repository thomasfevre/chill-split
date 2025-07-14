import { Group } from "@/lib/mock-data";  // adjust path if needed

const STORAGE_KEY = "blockchain-groups-cache"

let groupCache: Group[] = loadGroups()

export function loadGroups(): Group[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Group[]) : []
  } catch (e) {
    console.warn("Error loading groups from sessionStorage", e)
    return []
  }
}

export function saveGroups(groups: Group[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch (e) {
    console.warn("Error saving groups to sessionStorage", e)
  }
}

export function getGroups(): Group[] {
  const t =  loadGroups()
  console.log("getGroups SESSION", t);
    return t
}

export function addOrUpdateGroup(group: Group) {
  const index = groupCache.findIndex((g) => g.id === group.id)
  if (index !== -1) {
    groupCache[index] = group
  } else {
    groupCache.push(group)
  }
  saveGroups(groupCache)
}

export function removeGroup(groupId: string) {
  groupCache = groupCache.filter((g) => g.id !== groupId)
  saveGroups(groupCache)
}

export function clearGroupsCache() {
  groupCache = []
  sessionStorage.removeItem(STORAGE_KEY)
}
