#!/usr/bin/env python3
"""Probe configured hosted providers using synthetic data; never print keys."""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
from urllib.parse import urlparse


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def load_environment(path):
    values = dict(os.environ)
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            values[key.strip()] = value.strip().strip('\"\'')
    return values


def request(url, headers, body=None):
    encoded = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=encoded, headers={"User-Agent": "FamilyVeda-provider-check/1.0", **headers})
    try:
        with urllib.request.build_opener(NoRedirects()).open(req, timeout=45) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, {}
    except (urllib.error.URLError, TimeoutError, ValueError):
        return 0, {}


def probe(values):
    example = {'memberProfile': 'Synthetic connectivity fixture', 'recentVitals': [],
               'episodes': [], 'conditions': [], 'confidence': 0.8}
    prompt = 'Return this exact JSON object only: ' + json.dumps(example)
    messages = [{'role': 'system', 'content': 'Synthetic API connectivity test. No clinical advice.'},
                {'role': 'user', 'content': prompt}]
    results = []
    for provider in ('Gemini', 'Groq', 'Cloudflare'):
        key_name = {'Gemini': 'Gemini__ApiKey', 'Groq': 'Llm__ApiKey',
                    'Cloudflare': 'Cloudflare__ApiKey'}[provider]
        key = values.get(key_name, '')
        if not key or key == 'CHANGE_ME' or (provider == 'Cloudflare' and not values.get('Cloudflare__AccountId')):
            results.append({'provider': provider, 'status': 'NOT_CONFIGURED'})
            continue
        headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key}
        if provider == 'Gemini':
            model = values.get('Gemini__Model', 'gemini-3.5-flash')
            headers = {'Content-Type': 'application/json', 'x-goog-api-key': key}
            url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent'
            body = {'contents': [{'parts': [{'text': prompt}]}],
                    'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'}}
        elif provider == 'Groq':
            model = values.get('Llm__Model', 'llama-3.1-8b-instant')
            url = values.get('Llm__BaseUrl', 'https://api.groq.com/openai/v1').rstrip('/') + '/chat/completions'
            destination = urlparse(url)
            if destination.scheme != 'https' or destination.hostname != 'api.groq.com' or destination.port not in (None, 443):
                results.append({'provider': provider, 'status': 'UNEXPECTED_ENDPOINT'})
                continue
            body = {'model': model, 'messages': messages, 'temperature': 0,
                    'response_format': {'type': 'json_object'}, 'max_tokens': 256}
        else:
            model = values.get('Cloudflare__Model', '@cf/meta/llama-3.1-8b-instruct-fp8')
            url = 'https://api.cloudflare.com/client/v4/accounts/' + values['Cloudflare__AccountId'] + '/ai/run/' + model
            body = {'messages': messages, 'temperature': 0, 'max_tokens': 256}
        status, envelope = request(url, headers, body)
        valid = False
        if status == 200:
            try:
                if provider == 'Gemini':
                    content = envelope['candidates'][0]['content']['parts'][0]['text']
                elif provider == 'Groq':
                    content = envelope['choices'][0]['message']['content']
                else:
                    content = envelope['result']['response']
                content = content.strip()
                if content.startswith('```') and content.endswith('```'):
                    content = content.split('\n', 1)[1].rsplit('```', 1)[0].strip()
                valid = json.loads(content) == example
            except (KeyError, IndexError, TypeError, ValueError):
                pass
        results.append({'provider': provider, 'model': model, 'http': status,
                        'synthetic_json_valid': valid})
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', default='.env.local')
    args = parser.parse_args()
    for result in probe(load_environment(args.env_file)):
        print(json.dumps(result))
