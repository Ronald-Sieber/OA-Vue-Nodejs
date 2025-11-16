<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="部门名称" prop="deptName">
            <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable style="width: 200px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd"
               v-hasPermi="['system:dept:add']">新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleBatchDelete"
               v-hasPermi="['system:dept:remove']">批量删除</el-button>
         </el-col>
      </el-row>

      <el-table v-if="refreshTable" v-loading="loading" :data="deptList" row-key="deptId"
         :default-expand-all="isExpandAll" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
         @selection-change="onSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column prop="deptName" label="部门名称" width="240"></el-table-column>
         <el-table-column prop="leader" label="负责人" width="160"></el-table-column>
         <el-table-column prop="phone" label="联系电话" width="160"></el-table-column>
         <el-table-column prop="email" label="邮箱" width="240"></el-table-column>
         <el-table-column label="创建时间" align="center" prop="createTime" width="200">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="操作" min-width="80">
            <template #default="scope">
               <el-button link type="primary" @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:dept:edit']">修改</el-button>
               <el-button link type="primary" @click="handleAdd(scope.row)"
                  v-hasPermi="['system:dept:add']">新增</el-button>
               <el-button v-if="scope.row.parentId != 0" link type="primary" icon="Delete"
                  @click="handleDelete(scope.row)" v-hasPermi="['system:dept:remove']">删除</el-button>
            </template>
         </el-table-column>
      </el-table>

      <!-- 添加或修改部门对话框 -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
         <el-form ref="deptRef" :model="form" :rules="rules" label-width="80px">

            <el-form-item label="部门名称" prop="deptName">
               <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
            <el-form-item label="负责人" prop="leader">
               <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
               <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
               <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
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

<script setup name="Dept">
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/system/dept"

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const deptList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const title = ref("")
const deptOptions = ref([])
const isExpandAll = ref(true)
const refreshTable = ref(true)

const data = reactive({
   form: {},
   queryParams: {
      deptName: undefined,
      status: undefined
   },
   rules: {
      deptName: [{ required: true, message: "部门名称不能为空", trigger: "blur" }],
      leader: [{ required: true, message: "负责人不能为空", trigger: "blur" }],
      email: [{ required: true, message: "邮箱不能为空", trigger: "blur" }, { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
      phone: [{ required: true, message: "联系电话不能为空", trigger: "blur" }, { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }]
   },
})

const { queryParams, form, rules } = toRefs(data)

/** 查询部门列表 */
function getList() {
   loading.value = true
   listDept(queryParams.value).then(response => {
      deptList.value = proxy.handleTree(response.data, "deptId")
      loading.value = false
   })
}

/** 取消按钮 */
function cancel() {
   open.value = false
   reset()
}

/** 表单重置 */
function reset() {
   form.value = {
      deptId: undefined,
      parentId: undefined,
      deptName: undefined,
      orderNum: 0,
      leader: undefined,
      phone: undefined,
      email: undefined,
      status: "0"
   }
   proxy.resetForm("deptRef")
}

/** 搜索按钮操作 */
function handleQuery() {
   getList()
}

/** 重置按钮操作 */
function resetQuery() {
   proxy.resetForm("queryRef")
   handleQuery()
}

/** 新增按钮操作 */
function handleAdd(row) {
   reset()
   listDept().then(response => {
      deptOptions.value = proxy.handleTree(response.data, "deptId")
   })
   if (row != undefined) {
      form.value.parentId = row.deptId
   }
   open.value = true
   title.value = "添加部门"
}



/** 修改按钮操作 */
function handleUpdate(row) {
   reset()
   listDeptExcludeChild(row.deptId).then(response => {
      deptOptions.value = proxy.handleTree(response.data, "deptId")
   })
   getDept(row.deptId).then(response => {
      form.value = response.data
      open.value = true
      title.value = "修改部门"
   })
}

/** 提交按钮 */
function submitForm() {
   proxy.$refs["deptRef"].validate(valid => {
      if (valid) {
         if (form.value.deptId != undefined) {
            updateDept(form.value).then(response => {
               proxy.$modal.msgSuccess("修改成功")
               open.value = false
               getList()
            })
         } else {
            addDept(form.value).then(response => {
               proxy.$modal.msgSuccess("新增成功")
               open.value = false
               getList()
            })
         }
      }
   })
}

/** 删除按钮操作 */
function handleDelete(row) {
   proxy.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项?').then(function () {
      return delDept(row.deptId)
   }).then(() => {
      getList()
      proxy.$modal.msgSuccess("删除成功")
   }).catch(() => { })
}

// 批量删除
const selectedIds = ref([])
const multiple = ref(true)
function onSelectionChange(selection) {
   selectedIds.value = selection.map(item => item.deptId)
   multiple.value = !selection.length
}
function handleBatchDelete() {
   if (!selectedIds.value.length) return
   proxy.$modal.confirm('是否确认删除选中的部门数据项?').then(function () {
      return delDept(selectedIds.value.join(','))
   }).then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
   }).catch(() => { })
}

getList()
</script>
