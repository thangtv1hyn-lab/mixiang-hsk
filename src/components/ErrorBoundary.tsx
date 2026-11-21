import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let friendly = 'Đã xảy ra sự cố ngoài ý muốn khi tải dữ liệu.';
    if (error?.message) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed && typeof parsed.error === 'string') {
          if (parsed.error.toLowerCase().includes('permission')) {
            friendly =
              'Tài khoản hiện tại không đủ quyền thực hiện thao tác dữ liệu này. Vui lòng đăng nhập lại bằng tài khoản phù hợp.';
          } else {
            friendly = `Lỗi đồng bộ dữ liệu: ${parsed.error}`;
          }
        } else {
          friendly = error.message;
        }
      } catch {
        friendly = error.message;
      }
    }
    return { hasError: true, errorMessage: friendly };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE5DC] shadow-sm p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-[#C85A43] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#1C1E21]">
                Rất tiếc, đã xảy ra lỗi hiển thị
              </h2>
              <p className="text-sm text-[#686B72] leading-relaxed break-words">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 px-5 rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
