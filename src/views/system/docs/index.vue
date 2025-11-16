<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="标题" prop="q">
        <el-input v-model="queryParams.q" placeholder="请输入标题关键词" clearable style="width: 240px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="时间" style="width: 308px">
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="docList" :row-key="row => row._id">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column label="标题" prop="title" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" prop="createdAt" width="180">
        <template #default="scope"><span>{{ parseTime(scope.row.createdAt) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" min-width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="docRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="附件">
          <input ref="fileInput" type="file" multiple style="display:none" @change="onFilesSelected" />
          <div class="upload-actions">
            <el-button type="success" @click="triggerUpload">上传附件</el-button>
          </div>
          <div class="attachment-list">
            <el-tag v-for="(a, i) in form.attachments" :key="i" closable @close="removeAttachment(i)"
              style="margin-right: 8px;">{{ a.name }}</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog title="查看文档" v-model="viewOpen" width="700px" append-to-body>
      <div>
        <p><strong>标题：</strong>{{ viewDoc.title }}</p>
        <p><strong>内容：</strong>{{ viewDoc.content }}</p>
        <p><strong>附件：</strong>
          <span v-if="!viewDoc.attachments || !viewDoc.attachments.length">无</span>
          <span v-else>
            <el-link v-for="(a, i) in viewDoc.attachments" :key="i" :href="a.url" target="_blank" :download="a.name"
              style="margin-right:8px">{{ a.name }}</el-link>
          </span>
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs } from 'vue'
import { listDocs, addDoc, updateDoc, delDoc, uploadFile } from '@/api/system/docs'

const { proxy } = getCurrentInstance()

const docList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref('')
const dateRange = ref([])
const fileInput = ref(null)

const data = reactive({
  form: { title: '', content: '', attachments: [] },
  queryParams: { pageNum: 1, pageSize: 10, q: undefined }
})
const { form, queryParams } = toRefs(data)

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listDocs(params).then(res => {
    docList.value = res.rows || []
    total.value = res.total || 0
    loading.value = false
  })
}
function handleQuery() { getList() }
function resetQuery() { proxy.resetForm('queryRef'); dateRange.value = []; getList() }

function handleAdd() { open.value = true; title.value = '新增文档'; form.value = { title: '', content: '', attachments: [] } }
function handleEdit(row) { open.value = true; title.value = '编辑文档'; form.value = { title: row.title, content: row.content || '', attachments: row.attachments || [], _id: row._id } }
function cancel() { open.value = false; form.value = { title: '', content: '', attachments: [] } }

function triggerUpload() { fileInput.value && fileInput.value.click() }
function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const tasks = files.map(f => uploadFile(f))
  Promise.all(tasks).then(list => {
    const uploaded = list.map(r => ({ name: r.name || (r.data && r.data.name) || '附件', url: r.url || (r.data && r.data.url), size: r.size || (r.data && r.data.size) }))
    form.value.attachments = (form.value.attachments || []).concat(uploaded)
    e.target.value = ''
  })
}
function removeAttachment(i) { form.value.attachments.splice(i, 1) }

function submitForm() {
  proxy.$refs['docRef'].validate(valid => {
    if (!valid) return
    const payload = { title: form.value.title, content: form.value.content, attachments: form.value.attachments }
    if (form.value._id) {
      updateDoc(form.value._id, payload).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() })
    } else {
      addDoc(payload).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() })
    }
  })
}

const rules = { title: [{ required: true, message: '标题不能为空', trigger: 'blur' }] }

getList()
// 查看弹窗
const viewOpen = ref(false)
const viewDoc = ref({ title: '', content: '', attachments: [] })
function handleView(row) { viewDoc.value = { title: row.title, content: row.content || '', attachments: row.attachments || [] }; viewOpen.value = true }
</script>

<style scoped>
.upload-actions {
  margin-top: 8px;
}

.attachment-list {
  margin-top: 8px;
}
</style>
