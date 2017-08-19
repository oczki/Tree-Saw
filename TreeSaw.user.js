// ==UserScript==
// @name         Tree Saw
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hide selected offers on Gumtree
// @author       fri
// @match        https://www.gumtree.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let offerSelector = "div.result-link";
    let mailIconSelector = "div.ui-btn-reply-container";
    let titleSelector = "div.title a";
    let descSelector = "div.description span";

    function applyCss(rules) {
        let style = document.createElement("style");
        style.type = "text/css";
        if (style.styleSheet) {
            style.styleSheet.cssText = rules;
        } else {
            style.appendChild(document.createTextNode(rules));
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function addEyeIcon(node) {
        let eye = document.createElement("span");
        eye.classList.add("starIcon");
        eye.classList.add("eyeIcon");
        eye.addEventListener("click", function(event) {
                                          event.stopPropagation();
                                          toggleOfferVisibility(node);
                                      },
                             false);
        insertAfter(eye, node.querySelector(mailIconSelector));
        node.setAttribute("hasEye", "true");
    }

    function hasEyeIcon(node) {
        return (node.getAttribute("hasEye") === "true");
    }

    function getDesc(node) {
        let desc = node.querySelector(descSelector);
        if (desc !== null)
            return desc.innerHTML;
        else
            return "";
    }

    function getBlacklist() {
        return JSON.parse(localStorage.getItem("blacklist")) || [];
    }

    function setBlacklist(data) {
        localStorage.setItem("blacklist", JSON.stringify(data));
    }

    function addToBlacklist(node) {
        let desc = getDesc(node);
        let blacklist = getBlacklist();
        if (blacklist.indexOf(desc) === -1) {
            blacklist.push(desc);
            setBlacklist(blacklist);
        }
    }

    function removeFromBlacklist(node) {
        let desc = getDesc(node);
        let blacklist = getBlacklist();
        if (blacklist.indexOf(desc) > -1) {
            let found = blacklist.indexOf(desc);
            while (found !== -1) {
                blacklist.splice(found, 1);
                found = blacklist.indexOf(desc);
            }
            setBlacklist(blacklist);
        }
    }

    function hideIfBlacklisted(node) {
        let desc = getDesc(node);
        let blacklist = getBlacklist();
        if (blacklist.indexOf(desc) > -1) {
            hideOffer(node);
        }
    }

    function hideOffer(node) {
        node.style.opacity = 0.15;
        node.setAttribute("blacklisted", "true");
        addToBlacklist(node);
    }

    function showOffer(node) {
        node.style.opacity = 1.0;
        node.setAttribute("blacklisted", "false");
        removeFromBlacklist(node);
    }

    function toggleOfferVisibility(node) {
        if (node.getAttribute("blacklisted") == "true")
            showOffer(node);
        else
            hideOffer(node);
    }

    function process() {
        let offers = document.querySelectorAll(offerSelector);
        for (let offer of offers) {
            if (!hasEyeIcon(offer)) {
                addEyeIcon(offer);
                hideIfBlacklisted(offer);
            }
        }
    }

    process();

    let eyeIconLine = "url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIuMDAxIDUxMi4wMDEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMi4wMDEgNTEyLjAwMTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik01MDMuNjk4LDIzMS44OTVjLTI4LjczNS0zNi44NDMtNjUuOTU2LTY3LjMxOC0xMDcuNjM3LTg4LjEyOGMtNDIuNTQ4LTIxLjI0My04OC4zMjEtMzIuMjY1LTEzNi4xMDQtMzIuODQzICAgIGMtMS4zMTYtMC4wMzYtNi42LTAuMDM2LTcuOTE2LDBjLTQ3Ljc4MiwwLjU3OS05My41NTYsMTEuNi0xMzYuMTA0LDMyLjg0M2MtNDEuNjgxLDIwLjgxLTc4LjksNTEuMjg0LTEwNy42MzYsODguMTI4ICAgIGMtMTEuMDcsMTQuMTkzLTExLjA3LDM0LjAxOCwwLDQ4LjIxMWMyOC43MzUsMzYuODQzLDY1Ljk1NSw2Ny4zMTgsMTA3LjYzNiw4OC4xMjhjNDIuNTQ4LDIxLjI0Myw4OC4zMjEsMzIuMjY1LDEzNi4xMDQsMzIuODQzICAgIGMxLjMxNiwwLjAzNiw2LjYsMC4wMzYsNy45MTYsMGM0Ny43ODItMC41NzksOTMuNTU2LTExLjYsMTM2LjEwNC0zMi44NDNjNDEuNjgxLTIwLjgxLDc4LjkwMS01MS4yODQsMTA3LjYzNy04OC4xMjggICAgQzUxNC43NjgsMjY1LjkxMSw1MTQuNzY4LDI0Ni4wODgsNTAzLjY5OCwyMzEuODk1eiBNMTI1LjI0MiwzNDkuNTk5Yy0zOC45Mi0xOS40MzItNzMuNjc4LTQ3Ljg5Mi0xMDAuNTE3LTgyLjMwMyAgICBjLTUuMTg3LTYuNjUxLTUuMTg3LTE1Ljk0LDAtMjIuNTkxYzI2LjgzOC0zNC40MTEsNjEuNTk2LTYyLjg3MSwxMDAuNTE3LTgyLjMwM2MxMS4wNTQtNS41MTgsMjIuMzQyLTEwLjI5LDMzLjgzOS0xNC4zMyAgICBjLTI5LjU3OCwyNi41ODgtNDguMjEzLDY1LjEyLTQ4LjIxMywxMDcuOTI4YzAsNDIuODEsMTguNjM2LDgxLjM0NSw0OC4yMTcsMTA3LjkzMiAgICBDMTQ3LjU4OCwzNTkuODkyLDEzNi4yOTcsMzU1LjExOCwxMjUuMjQyLDM0OS41OTl6IE0yNTYsMzgwLjMwM2MtNjguNTQyLDAtMTI0LjMwNC01NS43NjItMTI0LjMwNC0xMjQuMzA0ICAgIFMxODcuNDU4LDEzMS42OTYsMjU2LDEzMS42OTZTMzgwLjMwNCwxODcuNDU4LDM4MC4zMDQsMjU2UzMyNC41NDIsMzgwLjMwMywyNTYsMzgwLjMwM3ogTTQ4Ny4yNzUsMjY3LjI5NSAgICBjLTI2LjgzOCwzNC40MTEtNjEuNTk2LDYyLjg3MS0xMDAuNTE3LDgyLjMwM2MtMTEuMDQxLDUuNTEyLTIyLjMyMiwxMC4yNjMtMzMuODA1LDE0LjI5OSAgICBjMjkuNTU4LTI2LjU4Nyw0OC4xNzktNjUuMTA3LDQ4LjE3OS0xMDcuODk4YzAtNDIuODE0LTE4LjY0LTgxLjM1MS00OC4yMjMtMTA3LjkzOWMxMS41LDQuMDQxLDIyLjc5Myw4LjgxOSwzMy44NSwxNC4zNCAgICBjMzguOTIsMTkuNDMyLDczLjY3OCw0Ny44OTIsMTAwLjUxNyw4Mi4zMDNDNDkyLjQ2MiwyNTEuMzU1LDQ5Mi40NjIsMjYwLjY0NCw0ODcuMjc1LDI2Ny4yOTV6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjU2LDIwMi44MDRjLTI5LjMzMiwwLTUzLjE5NSwyMy44NjMtNTMuMTk1LDUzLjE5NXMyMy44NjMsNTMuMTk1LDUzLjE5NSw1My4xOTVzNTMuMTk1LTIzLjg2Myw1My4xOTUtNTMuMTk1ICAgIEMzMDkuMTk2LDIyNi42NjcsMjg1LjMzMywyMDIuODA0LDI1NiwyMDIuODA0eiBNMjU2LDI4OC4zNjdjLTE3Ljg0NywwLTMyLjM2OC0xNC41MTktMzIuMzY4LTMyLjM2OCAgICBjMC0xNy44NDgsMTQuNTE5LTMyLjM2NywzMi4zNjgtMzIuMzY3YzE3Ljg0NywwLDMyLjM2NywxNC41MTksMzIuMzY3LDMyLjM2N0MyODguMzY4LDI3My44NDgsMjczLjg0NywyODguMzY3LDI1NiwyODguMzY3eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)";
    let eyeIconFill = "url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4OC44NSA0ODguODUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ4OC44NSA0ODguODU7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4Ij4KPGc+Cgk8cGF0aCBkPSJNMjQ0LjQyNSw5OC43MjVjLTkzLjQsMC0xNzguMSw1MS4xLTI0MC42LDEzNC4xYy01LjEsNi44LTUuMSwxNi4zLDAsMjMuMWM2Mi41LDgzLjEsMTQ3LjIsMTM0LjIsMjQwLjYsMTM0LjIgICBzMTc4LjEtNTEuMSwyNDAuNi0xMzQuMWM1LjEtNi44LDUuMS0xNi4zLDAtMjMuMUM0MjIuNTI1LDE0OS44MjUsMzM3LjgyNSw5OC43MjUsMjQ0LjQyNSw5OC43MjV6IE0yNTEuMTI1LDM0Ny4wMjUgICBjLTYyLDMuOS0xMTMuMi00Ny4yLTEwOS4zLTEwOS4zYzMuMi01MS4yLDQ0LjctOTIuNyw5NS45LTk1LjljNjItMy45LDExMy4yLDQ3LjIsMTA5LjMsMTA5LjMgICBDMzQzLjcyNSwzMDIuMjI1LDMwMi4yMjUsMzQzLjcyNSwyNTEuMTI1LDM0Ny4wMjV6IE0yNDguMDI1LDI5OS42MjVjLTMzLjQsMi4xLTYxLTI1LjQtNTguOC01OC44YzEuNy0yNy42LDI0LjEtNDkuOSw1MS43LTUxLjcgICBjMzMuNC0yLjEsNjEsMjUuNCw1OC44LDU4LjhDMjk3LjkyNSwyNzUuNjI1LDI3NS41MjUsMjk3LjkyNSwyNDguMDI1LDI5OS42MjV6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)";

    applyCss(`
        .eyeIcon {
            margin: 1px 0 0 11px;
            background-image: ${eyeIconLine};
        }
        .eyeIcon:hover {
            background-image: ${eyeIconFill};
        }
    `);
})();