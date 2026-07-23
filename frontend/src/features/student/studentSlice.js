import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/attendance';

export const fetchStudentHistory = createAsyncThunk(
  'student/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getMyAttendance();
      if (res.success && res.data) {
        return res.data.sort((a, b) => new Date(b.checkinAt) - new Date(a.checkinAt));
      }
      return rejectWithValue(res.message || 'Lỗi khi tải lịch sử');
    } catch (err) {
      return rejectWithValue(err.message || 'Lỗi khi tải lịch sử');
    }
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState: {
    history: [],
    loadingHistory: false,
    error: null,
  },
  reducers: {
    clearStudentState: (state) => {
      state.history = [];
      state.loadingHistory = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(fetchStudentHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.history = action.payload;
      })
      .addCase(fetchStudentHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload;
      });
  },
});

export const { clearStudentState } = studentSlice.actions;
export default studentSlice.reducer;
