import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/attendance';

export const fetchSessions = createAsyncThunk(
  'teacher/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.listSessions();
      if (res.success && res.data) {
        return res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return rejectWithValue(res.message || 'Lỗi khi tải danh sách phiên');
    } catch (err) {
      return rejectWithValue(err.message || 'Lỗi mạng');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'teacher/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.listCourses();
      if (res.success && res.data?.courses) {
        return res.data.courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return rejectWithValue(res.message || 'Lỗi khi tải danh sách môn học');
    } catch (err) {
      return rejectWithValue(err.message || 'Lỗi mạng');
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState: {
    sessionList: [],
    loadingSessions: true,
    error: null,
    courseList: [],
    loadingCourses: false,
    courseError: null,
  },
  reducers: {
    addSession: (state, action) => {
      state.sessionList.unshift(action.payload);
    },
    updateSessionStatus: (state, action) => {
      const { id, isOpen } = action.payload;
      const session = state.sessionList.find((s) => s.id === id);
      if (session) {
        session.isOpen = isOpen;
      }
    },
    removeSession: (state, action) => {
      state.sessionList = state.sessionList.filter((s) => s.id !== action.payload);
    },
    addCourse: (state, action) => {
      state.courseList.unshift(action.payload);
    },
    removeCourse: (state, action) => {
      state.courseList = state.courseList.filter((c) => c.courseId !== action.payload);
    },
    clearTeacherState: (state) => {
      state.sessionList = [];
      state.courseList = [];
      state.loadingSessions = false;
      state.error = null;
      state.courseError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.loadingSessions = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loadingSessions = false;
        state.sessionList = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loadingSessions = false;
        state.error = action.payload;
      })
      .addCase(fetchCourses.pending, (state) => {
        state.loadingCourses = true;
        state.courseError = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loadingCourses = false;
        state.courseList = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loadingCourses = false;
        state.courseError = action.payload;
      });
  },
});

export const { addSession, updateSessionStatus, removeSession, addCourse, removeCourse, clearTeacherState } = teacherSlice.actions;
export default teacherSlice.reducer;
