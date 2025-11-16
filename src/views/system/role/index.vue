<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true" label-width="68px">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable style="width: 240px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
          start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:role:add']">新增</el-button>
      </el-col>

      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:role:remove']">批量删除</el-button>
      </el-col>


    </el-row>

    <!-- 表格数据 -->
    <el-table v-loading="loading" :data="roleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" width="100" />

      <el-table-column label="创建时间" align="center" prop="createTime">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" min-width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.roleId !== 1" link type="primary" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:role:edit']">修改</el-button>
          <el-button v-if="scope.row.roleId !== 1" link type="primary" @click="handleDelete(scope.row)"
            v-hasPermi="['system:role:remove']">删除</el-button>
          <el-button v-if="scope.row.roleId !== 1" link type="primary" @click="openSelectUser(scope.row)"
            v-hasPermi="['system:role:edit']">分配用户</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改角色配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="roleRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree class="tree-border" :data="menuOptions" show-checkbox ref="menuRef" node-key="id"
            :check-strictly="!form.menuCheckStrictly" default-expand-all empty-text="加载中，请稍候"
            :props="{ label: 'label', children: 'children' }"></el-tree>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <select-user ref="selectRef" :roleId="currentRoleId" @ok="getList" />
  </div>
</template>

<script setup name="Role">
import { addRole, delRole, getRole, listRole, updateRole } from "@/api/system/role"
import { roleMenuTreeselect, treeselect as menuTreeselect } from "@/api/system/menu"
import SelectUser from './selectUser.vue'

const router = useRouter()
const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const roleList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const dateRange = ref([])
const menuOptions = ref([])
const menuExpand = ref(false)
const menuNodeAll = ref(false)
const menuRef = ref(null)
const selectRef = ref(null)
const currentRoleId = ref('')


const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: undefined
  },
  rules: {
    roleName: [{ required: true, message: "角色名称不能为空", trigger: "blur" }]
  },
})

const { queryParams, form, rules } = toRefs(data)

/** 查询角色列表 */
function getList() {
  loading.value = true
  listRole(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row) {
  const roleIds = row.roleId || ids.value
  const name = row.roleName || (Array.isArray(roleIds) ? '选中角色' : roleIds)
  proxy.$modal.confirm(`是否确认删除${name}角色？`, '温馨提示').then(function () {
    return delRole(roleIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}



/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.roleId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 角色状态修改 */




/** 分配用户（弹窗）*/
function openSelectUser(row) {
  currentRoleId.value = row.roleId
  nextTick(() => {
    selectRef.value && selectRef.value.show()
  })
}

/** 查询菜单树结构 */
function getMenuTreeselect() {
  menuTreeselect().then(response => {
    menuOptions.value = response.data
  })
}



/** 重置新增的表单以及其他数据  */
function reset() {
  if (menuRef.value != undefined) {
    menuRef.value.setCheckedKeys([])
  }
  menuExpand.value = false
  menuNodeAll.value = false
  form.value = {
    roleId: undefined,
    roleName: undefined,
    status: "0",
    menuIds: [],
    menuCheckStrictly: true,
    remark: undefined
  }
  proxy.resetForm("roleRef")
}

/** 添加角色 */
function handleAdd() {
  reset()
  getMenuTreeselect()
  open.value = true
  title.value = "添加角色"
}

/** 修改角色 */
function handleUpdate(row) {
  reset()
  const roleId = row.roleId || ids.value
  const roleMenu = getRoleMenuTreeselect(roleId)
  getRole(roleId).then(response => {
    form.value = response.data

    open.value = true
    nextTick(() => {
      roleMenu.then((res) => {
        let checkedKeys = res.checkedKeys
        checkedKeys.forEach((v) => {
          nextTick(() => {
            menuRef.value.setChecked(v, true, false)
          })
        })
      })
    })
  })
  title.value = "修改角色"
}

/** 根据角色ID查询菜单树结构 */
function getRoleMenuTreeselect(roleId) {
  return roleMenuTreeselect(roleId).then(response => {
    menuOptions.value = response.menus
    return response
  })
}



/** 树权限（展开/折叠）*/
function handleCheckedTreeExpand(value, type) {
  if (type == "menu") {
    let treeList = menuOptions.value
    for (let i = 0; i < treeList.length; i++) {
      menuRef.value.store.nodesMap[treeList[i].id].expanded = value
    }
  }
}

/** 树权限（全选/全不选） */
function handleCheckedTreeNodeAll(value, type) {
  if (type == "menu") {
    menuRef.value.setCheckedNodes(value ? menuOptions.value : [])
  }
}

/** 树权限（父子联动） */
function handleCheckedTreeConnect(value, type) {
  if (type == "menu") {
    form.value.menuCheckStrictly = value ? true : false
  }
}

/** 所有菜单节点数据 */
function getMenuAllCheckedKeys() {
  // 目前被选中的菜单节点
  let checkedKeys = menuRef.value.getCheckedKeys()
  // 半选中的菜单节点
  let halfCheckedKeys = menuRef.value.getHalfCheckedKeys()
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["roleRef"].validate(valid => {
    if (valid) {
      if (form.value.roleId != undefined) {
        form.value.menuIds = getMenuAllCheckedKeys()
        updateRole(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        form.value.menuIds = getMenuAllCheckedKeys()
        addRole(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}



getList()
</script>
