from __future__ import annotations

import json
import sys

from typing import Any, Final, TypedDict, cast


class TargetInfo(TypedDict):
    alias: str
    description: str
    fields: list[FieldInfo]
    provider: str
    summary: str

class FieldInfo(TypedDict):
    alias: str
    default: Any
    description: str
    provider: str
    required: bool
    type_hint: str

STUB_TEMPLATE: Final[str] = '''
# This file is generated by generate-builtins.py

from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Dict, Tuple, Union

# Not quite accurate - but good enough for typings
FrozenDict = Dict[str, Any]

{functions}
'''

FUNCTION_TEMPLATE: Final[str] = '''
def {alias}(
    {parameters}
) -> None:
    """
    {summary}

    {description}

    {parameter_descriptions}
    """
'''

PARAMETER_TEMPLATE: Final[str] = "{alias}: {type_hint}{maybe_default}"
PARAMETER_DESCRIPTION_TEMPLATE: Final[str] = ":param {alias}: {description}"

def make_pyi_stub(t: TargetInfo) -> str:
    parameters: list[str] = []
    parameter_descriptions: list[str] = []
    fields = sorted(t["fields"], key=lambda f: not f["required"])
    fields.insert(0, FieldInfo(alias="name", default=None, description="The name of the target", provider="", required=True, type_hint="str"))
    for f in fields:
        f["maybe_default"] = "" if f["required"] is True else f" = {f['default']}"
        parameters.append(PARAMETER_TEMPLATE.format(**f))
        parameter_descriptions.append(PARAMETER_DESCRIPTION_TEMPLATE.format(**f))
    return FUNCTION_TEMPLATE.format(
        alias=t["alias"],
        parameters=",\n    ".join(parameters),
        summary=t["summary"],
        description=t["description"],
        parameter_descriptions="\n    ".join(parameter_descriptions),
    )

data: dict[str, dict[str, Any]] = json.load(sys.stdin)
stubs: list[str] = []
for k,v in data["name_to_target_type_info"].items():
    v = cast(TargetInfo, v)
    stubs.append(make_pyi_stub(v))

with open("__builtins__.pyi", "w") as f:
    functions = "\n".join(stubs)
    f.write(STUB_TEMPLATE.format(functions=functions))
