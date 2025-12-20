@echo off
echo ========================================
echo   AI Notebook 实时协作系统启动
echo ========================================
echo.
echo [1/3] 启动 Yjs WebSocket 服务 (端口 8124)...
start "Yjs WebSocket Server" cmd /k "set HOST=localhost&& set PORT=8124&& npx y-websocket"
timeout /t 2 /nobreak >nul
echo.
echo [2/3] 启动 FastAPI 后端服务 (端口 8123)...
start "FastAPI Backend" cmd /k "python main.py"
timeout /t 3 /nobreak >nul
echo.
echo [3/3] 启动前端开发服务器...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"
echo.
echo ========================================
echo   所有服务已启动！
echo ========================================
echo.
echo   - Yjs WebSocket: ws://localhost:8124
echo   - FastAPI 后端:  http://localhost:8123
echo   - 前端应用:      看 npm run dev 输出的端口（可能是 3000）
echo.
echo   按任意键关闭此窗口...
pause >nul
