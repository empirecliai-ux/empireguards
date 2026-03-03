#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LISTENER_SCRIPT="${ROOT_DIR}/outpost_listener.py"
LOG_DIR="${ROOT_DIR}/logs"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
LOG_FILE="${LOG_DIR}/outpost_listener.log"
PID_FILE="${RUNTIME_DIR}/outpost.pid"
PYTHON_BIN="${PYTHON_BIN:-python3}"

is_running() {
    local pid="$1"
    [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null
}

get_pid() {
    if [[ -f "${PID_FILE}" ]]; then
        tr -d '[:space:]' < "${PID_FILE}"
    fi
}

run_supervisor() {
    mkdir -p "${LOG_DIR}" "${RUNTIME_DIR}"

    {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] supervisor started (pid $$)"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] listener script: ${LISTENER_SCRIPT}"
    } >> "${LOG_FILE}"

    local backoff=1
    local max_backoff=60
    local listener_pid=""

    shutdown() {
        {
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] supervisor stopping"
        } >> "${LOG_FILE}"

        if [[ -n "${listener_pid}" ]] && is_running "${listener_pid}"; then
            kill "${listener_pid}" 2>/dev/null || true
            wait "${listener_pid}" 2>/dev/null || true
        fi

        rm -f "${PID_FILE}"
        exit 0
    }

    trap shutdown INT TERM

    while true; do
        if [[ ! -f "${LISTENER_SCRIPT}" ]]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] listener missing: ${LISTENER_SCRIPT}; retrying in ${backoff}s" >> "${LOG_FILE}"
            sleep "${backoff}"
            backoff=$(( backoff < max_backoff ? backoff * 2 : max_backoff ))
            continue
        fi

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] launching outpost_listener.py" >> "${LOG_FILE}"
        "${PYTHON_BIN}" -u "${LISTENER_SCRIPT}" >> "${LOG_FILE}" 2>&1 &
        listener_pid=$!

        wait "${listener_pid}"
        local exit_code=$?
        listener_pid=""

        if [[ "${exit_code}" -eq 0 ]]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] listener exited cleanly; restarting in 1s" >> "${LOG_FILE}"
            backoff=1
            sleep 1
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] listener crashed with code ${exit_code}; restarting in ${backoff}s" >> "${LOG_FILE}"
            sleep "${backoff}"
            backoff=$(( backoff < max_backoff ? backoff * 2 : max_backoff ))
        fi
    done
}

start() {
    mkdir -p "${LOG_DIR}" "${RUNTIME_DIR}"

    local pid
    pid="$(get_pid || true)"

    if [[ -n "${pid}" ]] && is_running "${pid}"; then
        echo "outpost supervisor already running (pid ${pid})"
        exit 0
    fi

    if [[ -n "${pid}" ]]; then
        rm -f "${PID_FILE}"
    fi

    nohup "${BASH_SOURCE[0]}" __run >/dev/null 2>&1 &
    local new_pid=$!
    echo "${new_pid}" > "${PID_FILE}"

    echo "outpost supervisor started (pid ${new_pid})"
}

stop() {
    local pid
    pid="$(get_pid || true)"

    if [[ -z "${pid}" ]]; then
        echo "outpost supervisor is not running"
        exit 0
    fi

    if ! is_running "${pid}"; then
        echo "stale PID file found; cleaning up"
        rm -f "${PID_FILE}"
        exit 0
    fi

    kill "${pid}" 2>/dev/null || true

    for _ in {1..30}; do
        if ! is_running "${pid}"; then
            break
        fi
        sleep 0.2
    done

    if is_running "${pid}"; then
        echo "graceful stop timed out; force killing pid ${pid}"
        kill -9 "${pid}" 2>/dev/null || true
    fi

    rm -f "${PID_FILE}"
    echo "outpost supervisor stopped"
}

status() {
    local pid
    pid="$(get_pid || true)"

    if [[ -n "${pid}" ]] && is_running "${pid}"; then
        echo "outpost supervisor is running (pid ${pid})"
        exit 0
    fi

    echo "outpost supervisor is not running"
    exit 1
}

restart() {
    stop || true
    start
}

main() {
    local cmd="${1:-}"

    case "${cmd}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        status)
            status
            ;;
        restart)
            restart
            ;;
        __run)
            run_supervisor
            ;;
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            exit 1
            ;;
    esac
}

main "$@"
