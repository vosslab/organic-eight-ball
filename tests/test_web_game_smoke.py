import json
import os
import re

from get_repo_root import get_repo_root


REPO_ROOT = get_repo_root()
INDEX_HTML = os.path.join(REPO_ROOT, "index.html")
APP_JS = os.path.join(REPO_ROOT, "app.js")
GROUPS_JSON = os.path.join(REPO_ROOT, "functional_groups.json")
STYLE_CSS = os.path.join(REPO_ROOT, "style.css")


#============================================
def read_text(path: str) -> str:
	"""
	Read UTF-8 text file content.

	Args:
		path: Absolute file path.

	Returns:
		str: File text content.
	"""
	with open(path, "r", encoding="utf-8") as handle:
		return handle.read()


#============================================
def read_json(path: str) -> dict:
	"""
	Read and parse a JSON file.

	Args:
		path: Absolute file path.

	Returns:
		dict: Parsed JSON object.
	"""
	with open(path, "r", encoding="utf-8") as handle:
		return json.load(handle)


#============================================
def test_web_core_files_exist() -> None:
	"""
	Ensure core web game files exist.
	"""
	assert os.path.isfile(INDEX_HTML)
	assert os.path.isfile(APP_JS)
	assert os.path.isfile(GROUPS_JSON)


#============================================
def test_setup_modal_inputs_present() -> None:
	"""
	Ensure pre-game setup fields are present in HTML.
	"""
	html = read_text(INDEX_HTML)
	for marker in (
		'id="setup-modal"',
		'id="onboarding-modal"',
		'id="human-count"',
		'id="npc-count"',
		'id="start-game-btn"',
		'id="choices"',
		'id="status-banner"',
		'id="status-detail"',
		'id="sim-canvas"',
	):
		assert marker in html


#============================================
def test_default_setup_counts() -> None:
	"""
	Ensure setup defaults start with one human and one NPC.
	"""
	html = read_text(INDEX_HTML)
	assert 'id="human-count" type="number" min="1" max="8" value="1"' in html
	assert 'id="npc-count" type="number" min="0" max="8" value="1"' in html


#============================================
def test_how_to_play_copy_is_present() -> None:
	"""
	Ensure core first-time gameplay instructions are always in the page.
	"""
	html = read_text(INDEX_HTML)
	required_lines = (
		"Answer correctly to unlock your shot.",
		"Click and drag from the white cue ball to aim and set power.",
		"Release to shoot.",
		"After balls settle, a new question appears.",
		"Pool-themed quiz game (not regulation 8-ball)",
	)
	for line in required_lines:
		assert line in html


#============================================
def test_functional_groups_json_has_valid_assets() -> None:
	"""
	Validate group entries and referenced image files.
	"""
	data = read_json(GROUPS_JSON)
	assert "groups" in data
	assert isinstance(data["groups"], list)
	assert len(data["groups"]) >= 5

	for entry in data["groups"]:
		assert "id" in entry and isinstance(entry["id"], str) and entry["id"]
		assert "display_name" in entry and isinstance(entry["display_name"], str) and entry["display_name"]
		assert "image" in entry and isinstance(entry["image"], str) and entry["image"]
		assert "aliases" in entry and isinstance(entry["aliases"], list) and len(entry["aliases"]) > 0
		image_path = os.path.join(REPO_ROOT, entry["image"])
		assert os.path.isfile(image_path), f"missing image asset: {entry['image']}"


#============================================
def test_js_contains_turn_and_gate_rules() -> None:
	"""
	Ensure gameplay rules are present in JS source.
	"""
	js = read_text(APP_JS)
	required_fragments = (
		"let shotUnlocked = false;",
		"function switchTurn()",
		"if (!shotUnlocked)",
		"Player",
		"startGameFromSetup",
		"npcTryAnswer",
		"renderChoices",
		"handleChoiceAnswer",
		"updateStatusBanner",
		"Shot locked: answer first.",
		"PHASE_QUESTION_ACTIVE",
		"PHASE_SHOT_READY",
		"PHASE_BALLS_MOVING",
		"setPhase(PHASE_SHOT_READY)",
		"setPhase(PHASE_BALLS_MOVING)",
		"setPhase(PHASE_QUESTION_ACTIVE)",
		"setPointerCapture",
		"pointercancel",
		"lostpointercapture",
	)
	for fragment in required_fragments:
		assert fragment in js


#============================================
def test_js_has_no_3d_rendering_keywords() -> None:
	"""
	Guard against introducing explicit 3D rendering stacks.
	"""
	js = read_text(APP_JS).lower()
	patterns = [
		r"\bthree\.js\b",
		r"\bwebgl\b",
		r"\bperspectivecamera\b",
		r"\borthographiccamera\b",
		r"\brequestpointerlock\b",
	]
	for pattern in patterns:
		assert re.search(pattern, js) is None, f"found banned 3D keyword: {pattern}"


#============================================
def test_js_installs_input_hooks_before_awaiting_group_load() -> None:
	"""
	Ensure Start button hooks are wired before async data fetch completes.
	"""
	js = read_text(APP_JS)
	main_pos = js.find("async function main()")
	assert main_pos >= 0
	install_pos = js.find("installInputHooks();", main_pos)
	await_pos = js.find("await loadGroups();", main_pos)
	assert install_pos >= 0
	assert await_pos >= 0
	assert install_pos < await_pos


#============================================
def test_js_has_local_file_fallback_and_user_message() -> None:
	"""
	Ensure local file mode has explicit fallback and guidance messaging.
	"""
	js = read_text(APP_JS)
	assert 'window.location.protocol === "file:"' in js
	assert "LOCAL_FALLBACK_GROUPS" in js
	assert "Using local fallback groups." in js
	assert "python3 -m http.server 8000" in js


#============================================
def test_js_has_non_silent_group_load_failure_message() -> None:
	"""
	Ensure group-load failure surfaces clear user-facing errors.
	"""
	js = read_text(APP_JS)
	assert "Could not load functional_groups.json." in js
	assert "groupLoadErrorMessage" in js
	assert "answerText.textContent = groupLoadErrorMessage" in js


#============================================
def test_js_has_first_run_onboarding_logic() -> None:
	"""
	Ensure onboarding appears once and supports dismissal.
	"""
	js = read_text(APP_JS)
	assert "ONBOARDING_KEY" in js
	assert "maybeShowOnboarding" in js
	assert "dismissOnboarding" in js
	assert "localStorage" in js


#============================================
def test_hidden_overlay_pointer_events_guard_present() -> None:
	"""
	Ensure hidden UI state does not intercept pointer input.
	"""
	css = read_text(STYLE_CSS)
	assert ".is-hidden" in css
	assert "pointer-events: none" in css
