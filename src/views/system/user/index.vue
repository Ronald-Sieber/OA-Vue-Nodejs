<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!--用户数据-->
      <el-col :span="24">
            <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
              <el-form-item label="用户名称" prop="userName">
                <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 240px"
                  @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="手机号码" prop="phonenumber">
                <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable style="width: 240px"
                  @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="用户状态" clearable style="width: 240px">
                  <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label"
                    :value="dict.value" />
                </el-select>
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
                <el-button type="primary" plain icon="Plus" @click="handleAdd"
                  v-hasPermi="['system:user:add']">新增</el-button>
              </el-col>

              <el-col :span="1.5">
                <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
                  v-hasPermi="['system:user:remove']">批量删除</el-button>
              </el-col>

            </el-row>

            <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column label="用户名称" align="center" key="userName" prop="userName"
                :show-overflow-tooltip="true" />
              <el-table-column label="用户昵称" align="center" key="nickName" prop="nickName"
                :show-overflow-tooltip="true" />
              <el-table-column label="部门" align="center" key="deptName" prop="dept.deptName"
                :show-overflow-tooltip="true" />
              <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" width="120" />
              <el-table-column label="状态" align="center" key="status">
                <template #default="scope">
                  <el-switch v-model="scope.row.status" active-value="0" inactive-value="1"
                    @change="handleStatusChange(scope.row)"></el-switch>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" align="center" prop="createTime" width="160">
                <template #default="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" fixed="right" min-width="200"
                class-name="small-padding fixed-width">
                <template #default="scope">
                  <el-button v-if="scope.row.userId !== 1" link type="primary" @click="handleUpdate(scope.row)"
                    v-hasPermi="['system:user:edit']">修改</el-button>
                  <el-button v-if="scope.row.userId !== 1" link type="primary" @click="handleDelete(scope.row)"
                    v-hasPermi="['system:user:remove']">删除</el-button>
                  <el-button v-if="scope.row.userId !== 1" link type="primary" @click="handleResetPwd(scope.row)"
                    v-hasPermi="['system:user:resetPwd']">重置密码</el-button>
                  <el-button v-if="scope.row.userId !== 1" link type="primary" @click="openAssignRole(scope.row)"
                    v-hasPermi="['system:user:edit']">分配角色</el-button>
                </template>
              </el-table-column>
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
              v-model:limit="queryParams.pageSize" @pagination="getList" />

            <!-- 分配角色弹窗 -->
            <el-dialog title="分配角色" v-model="assignRoleOpen" width="800px" top="5vh" append-to-body
              :close-on-click-modal="true" :close-on-press-escape="true" :show-close="true" :destroy-on-close="true">
              <el-form :model="roleQuery" :inline="true" label-width="80px">
                <el-form-item label="角色名称" prop="roleName">
                  <el-input v-model="roleQuery.roleName" placeholder="请输入角色名称" clearable style="width: 240px"
                    @keyup.enter="filterRoleList" />
                </el-form-item>
                <el-form-item label="创建时间" style="width: 308px">
                  <el-date-picker v-model="roleDateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
                    start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Search" @click="filterRoleList">搜索</el-button>
                  <el-button icon="Refresh" @click="resetRoleQuery">重置</el-button>
                </el-form-item>
              </el-form>
              <el-table ref="roleTableRef" :data="filteredRoles" @selection-change="handleRoleSelectionChange"
                height="300px" :row-key="row => row.roleId">
                <el-table-column type="selection" width="55" :reserve-selection="true" :selectable="roleSelectable" />
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column label="角色名称" prop="roleName" />
                <el-table-column label="创建时间" prop="createTime" width="180">
                  <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <template #footer>
                <div class="dialog-footer">
                  <el-button type="primary" @click="submitAssignRoles">确 定</el-button>
                  <el-button @click="assignRoleOpen = false">取 消</el-button>
                </div>
              </template>
            </el-dialog>
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form :model="form" :rules="rules" ref="userRef" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select v-model="form.deptId" :data="enabledDeptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择归属部门"
                clearable check-strictly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择">
                <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label
                }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-select v-model="form.postIds" multiple placeholder="请选择">
                <el-option v-for="item in postOptions" :key="item.postId" :label="item.postName" :value="item.postId"
                  :disabled="item.status == 1"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="form.roleIds" multiple placeholder="请选择">
                <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId"
                  :disabled="item.status == 1"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>


  </div>
</template>

<script setup name="User">
import { watch } from 'vue'
import { getToken } from "@/utils/auth"
import useAppStore from '@/store/modules/app'
import { changeUserStatus, listUser, resetUserPwd, delUser, getUser, updateUser, addUser, deptTreeSelect, getAuthRole, updateAuthRole } from "@/api/system/user"
import request from '@/utils/request'
 

const router = useRouter()
const appStore = useAppStore()
const { proxy } = getCurrentInstance()
const { sys_normal_disable, sys_user_sex } = proxy.useDict("sys_normal_disable", "sys_user_sex")

const userList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const dateRange = ref([])
const deptName = ref("")
const deptOptions = ref([])
const enabledDeptOptions = ref([])
const initPassword = ref(undefined)
const postOptions = ref([])
const roleOptions = ref([])

function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = Array.isArray(response.data) ? response.data : []
    enabledDeptOptions.value = Array.isArray(response.data) ? response.data : []
  })
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined,
    status: undefined
  },
  rules: {
    userName: [{ required: true, message: "用户名称不能为空", trigger: "blur" }, { min: 2, max: 20, message: "用户名称长度必须介于 2 和 20 之间", trigger: "blur" }],
    nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
    password: [{ required: true, message: "用户密码不能为空", trigger: "blur" }, { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }, { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }],
    email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
    phonenumber: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }]
  }
})

const { queryParams, form, rules } = toRefs(data)



/** 查询用户列表 */
function getList() {
  loading.value = true
  listUser(proxy.addDateRange(queryParams.value, dateRange.value)).then(res => {
    loading.value = false
    userList.value = res.rows
    total.value = res.total
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
  const userIds = row.userId || ids.value
  const name = row.userName || (Array.isArray(userIds) ? '选中用户' : userIds)
  proxy.$modal.confirm(`是否确认删除${name}用户？`, '温馨提示').then(function () {
    return delUser(userIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}



/** 用户状态修改  */
function handleStatusChange(row) {
  let text = row.status === "0" ? "启用" : "停用"
  proxy.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗?').then(function () {
    return changeUserStatus(row.userId, row.status)
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0"
  })
}

/** 更多操作 */
function handleCommand(command, row) {
  switch (command) {
    case "handleResetPwd":
      handleResetPwd(row)
      break
    case "handleAuthRole":
      handleAuthRole(row)
      break
    default:
      break
  }
}

/** 跳转角色分配 */


/** 重置密码按钮操作 */
function handleResetPwd(row) {
  proxy.$prompt('请输入"' + row.userName + '"的新密码', "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    closeOnClickModal: false,
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: "用户密码长度必须介于 5 和 20 之间",
    inputValidator: (value) => {
      if (/<|>|"|'|\||\\/.test(value)) {
        return "不能包含非法字符：< > \" ' \\\ |"
      }
    },
  }).then(({ value }) => {
    resetUserPwd(row.userId, value).then(response => {
      proxy.$modal.msgSuccess("修改成功，新密码是：" + value)
    })
  }).catch(() => { })
}

/** 选择条数  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}



/** 重置操作表单 */
function reset() {
  form.value = {
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: undefined,
    status: "0",
    remark: undefined,
    postIds: [],
    roleIds: []
  }
  proxy.resetForm("userRef")
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  getUser().then(response => {
    postOptions.value = response.posts
    roleOptions.value = response.roles
    open.value = true
    title.value = "添加用户"
    form.value.password = initPassword.value
  })
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const userId = row.userId || ids.value
  getUser(userId).then(response => {
    form.value = response.data
    postOptions.value = response.posts
    roleOptions.value = response.roles
    form.value.postIds = response.postIds
    form.value.roleIds = response.roleIds
    open.value = true
    title.value = "修改用户"
    form.password = ""
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["userRef"].validate(valid => {
    if (valid) {
      if (form.value.userId != undefined) {
        updateUser(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addUser(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

onMounted(() => {
  getDeptTree()
  getList()
  proxy.getConfigKey("sys.user.initPassword").then(response => {
    initPassword.value = response.msg
  })
})

// 分配角色弹窗相关状态
const assignRoleOpen = ref(false)
const roleQuery = reactive({ roleName: undefined })
const roleDateRange = ref([])
const rolesAll = ref([])
const filteredRoles = ref([])
function applyRoleFilter() {
  const arr = rolesAll.value || []
  const name = roleQuery.roleName
  const dr = roleDateRange.value || []
  const s = dr && dr.length === 2 && dr[0] ? new Date(dr[0]).getTime() : null
  const e = dr && dr.length === 2 && dr[1] ? new Date(dr[1]).getTime() : null
  filteredRoles.value = arr.filter(r => {
    const nameOk = !name || String(r.roleName || '').includes(name)
    const t = new Date(r.createTime).getTime()
    const timeOk = s != null && e != null ? (t >= s && t <= e) : true
    return nameOk && timeOk
  })
}
const roleTableRef = ref(null)
const selectedRoleIds = ref([])
const currentUserId = ref('')

function filterRoleList() { applyRoleFilter() }
function resetRoleQuery() {
  roleQuery.roleName = undefined
  roleDateRange.value = []
  applyRoleFilter()
}
function roleSelectable(row) {
  return row.status === '0'
}
function handleRoleSelectionChange(selection) {
  selectedRoleIds.value = selection.map(item => item.roleId)
}
const openAssignRole = (row) => {
  currentUserId.value = row.userId
  assignRoleOpen.value = true
  getAuthRole(row.userId)
    .then(response => {
      rolesAll.value = response.roles || []
      applyRoleFilter()
      nextTick(() => {
        if (!roleTableRef.value) return
        filteredRoles.value.forEach(item => {
          if (item.flag) {
            roleTableRef.value.toggleRowSelection(item, true)
          }
        })
      })
    })
    .catch(async () => {
      // 后端接口异常或未登录时，回退到简单角色列表（无鉴权）
      try {
        const res = await request({ url: '/system/role/simpleList', method: 'get' })
        rolesAll.value = (res.rows || []).map(r => ({ ...r, flag: false }))
        applyRoleFilter()
      } catch { }
    })
}

// 自动响应查询条件变化
watch(() => roleQuery.roleName, () => applyRoleFilter())
watch(() => roleDateRange.value, () => applyRoleFilter(), { deep: true })
function submitAssignRoles() {
  const rIds = selectedRoleIds.value.join(',')
  updateAuthRole({ userId: currentUserId.value, roleIds: rIds }).then(() => {
    assignRoleOpen.value = false
    getList()
  })
}
</script>
