import os
import pathlib
import socket
import subprocess
import time

import pytest
from get_repo_root import get_repo_root


REPO_ROOT = get_repo_root()
INDEX_HTML = os.path.join(REPO_ROOT, "index.html")


#============================================
def make_driver():
	"""
	Create a headless Selenium Chrome driver, or skip if unavailable.

	Returns:
		webdriver.Chrome: A running Selenium driver.
	"""
	try:
		import selenium.common.exceptions
		import selenium.webdriver
	except Exception as error:
		pytest.skip(f"selenium not installed: {error}")

	options = selenium.webdriver.ChromeOptions()
	options.add_argument("--headless=new")
	options.add_argument("--disable-gpu")
	options.add_argument("--window-size=1280,900")
	options.add_argument("--allow-file-access-from-files")
	options.add_argument("--disable-dev-shm-usage")
	options.add_argument("--no-sandbox")
	options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

	try:
		return selenium.webdriver.Chrome(options=options)
	except selenium.common.exceptions.WebDriverException as error:
		pytest.skip(f"webdriver unavailable: {error}")


#============================================
def get_console_errors(driver) -> list[str]:
	"""
	Collect severe browser-console entries when supported by the driver.

	Args:
		driver: Selenium webdriver.

	Returns:
		list[str]: Console log lines.
	"""
	try:
		entries = driver.get_log("browser")
	except Exception:
		return []
	errors = []
	for entry in entries:
		level = str(entry.get("level", "")).upper()
		if level in ("SEVERE", "ERROR"):
			errors.append(str(entry.get("message", "")))
	return errors


#============================================
def assert_start_button_flow(driver, url: str) -> None:
	"""
	Run the startup click flow and assert setup modal closes.

	Args:
		driver: Selenium webdriver.
		url: Target page URL.
	"""
	driver.get(url)
	start_btn = driver.find_element("id", "start-game-btn")
	start_btn.click()
	modal = driver.find_element("id", "setup-modal")
	modal_class = modal.get_attribute("class")
	assert "hidden" in modal_class
	console_errors = get_console_errors(driver)
	if console_errors:
		joined = "\n".join(console_errors)
		assert "failed to load resource" not in joined.lower()


#============================================
def free_port() -> int:
	"""
	Get an available localhost TCP port.

	Returns:
		int: Free port number.
	"""
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		sock.bind(("127.0.0.1", 0))
		return int(sock.getsockname()[1])


#============================================
def wait_for_http_ready(port: int, timeout_s: float = 4.0) -> None:
	"""
	Wait until the local static server accepts connections.

	Args:
		port: Localhost port.
		timeout_s: Max wait time.
	"""
	deadline = time.time() + timeout_s
	while time.time() < deadline:
		try:
			with socket.create_connection(("127.0.0.1", port), timeout=0.2):
				return
		except OSError:
			time.sleep(0.05)
	raise AssertionError("local http server did not start in time")


#============================================
def test_start_button_hides_setup_modal_file_uri() -> None:
	"""
	Open index.html as file://, click Start Game, and verify setup modal hides.
	"""
	driver = make_driver()
	url = pathlib.Path(INDEX_HTML).resolve().as_uri()
	try:
		assert_start_button_flow(driver, url)
	finally:
		driver.quit()


#============================================
def test_start_button_hides_setup_modal_http_localhost() -> None:
	"""
	Open index.html over localhost static server and verify Start Game flow.
	"""
	port = free_port()
	server = subprocess.Popen(
		[
			"/opt/homebrew/opt/python@3.12/bin/python3.12",
			"-m",
			"http.server",
			str(port),
			"--bind",
			"127.0.0.1",
		],
		cwd=REPO_ROOT,
		stdout=subprocess.DEVNULL,
		stderr=subprocess.DEVNULL,
	)
	driver = make_driver()
	try:
		wait_for_http_ready(port)
		assert_start_button_flow(driver, f"http://127.0.0.1:{port}/index.html")
	finally:
		driver.quit()
		server.terminate()
		server.wait(timeout=5)
