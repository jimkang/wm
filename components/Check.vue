<template>
  <form @submit="findMentions" method="GET" action="/check">
    <div class="flex-fields">
      <label class="label" for="url">URL:</label>
      <input required v-on:input="handleInput" v-model="url" name="url" type="text" id="url">
      <button
        type="submit"
        class="btn"
        v-bind:disabled="loading"
        v-bind:class="{ loading: loading, btn: true }"
      >Start</button>
    </div>
    <div v-cloak>
      <p v-if="sent">
        <strong>Sent {{ mentions.map(_ => _.status < 400).length }} webmention notifications.</strong>
      </p>
      <p v-if="hasResult">
        <strong>{{ mentions.length === 0 ? 'No' : mentions.length }} webmention supported links found.</strong>
      </p>
      <p v-if="error">
        <strong v-html="error"></strong>
      </p>

      <ol id="mentions">
        <li v-bind:key="mention.target" v-for="mention in mentions">
          <span>source=</span>
          <a v-bind:href="mention.source">{{ mention.source }}</a>
          <br>
          <span>target=</span>
          <span v-if="mention.status">
            <span
              :class="['status', 'status-' + mention.status.toString().slice(0, 1) ]"
            >{{ mention.status }}</span>
          </span>
          <a v-bind:href="mention.target">{{ mention.target }}</a>
          <span v-if="mention.error">
            <br>
            {{ mention.error }}
          </span>
        </li>
      </ol>
      <p v-if="hasResult && mentions.length">
        <button v-on:click="sendMentions" class="btn cta">Send all webmentions</button>
      </p>
    </div>
  </form>
</template>

<style scoped>
</style>



<script>
// TODO handle errors / 429 etc
const API = process.env.API;
export default {
  props: {
    query: String,
    onInput: Function
  },
  data: function() {
    return {
      url: this.query,
      loading: false,
      mentions: [],
      sent: false,
      hasResult: false,
      error: null
    };
  },
  methods: {
    handleInput(e) {
      this.$emit("input", e);
    },
    async sendMentions(event) {
      event.preventDefault();
      this.loading = true;
      const res = await fetch(
        `${API}/check/?url=${encodeURIComponent(this.url)}`,
        {
          method: "post"
        }
      );
      this.loading = false;
      const json = await res.json();
      if (!json.error) {
        this.mentions = json.urls;
        this.sent = true;
      } else {
        this.mentions = [];
        this.error = json.message;
      }
      this.hasResult = false;
    },
    errorText(message, status) {
      return `There was a possible error with this request:<br><em>${message}</em><br><br><a target="_blank" href="https://github.com/remy/wm/issues/new?title=${escape(
        "Error with " + this.url
      )}&body=${escape(
        "URL: " +
          this.url +
          "\nStatus: " +
          status +
          "\nError: `" +
          message +
          "`"
      )}">If you think this is wrong, please raise an issue</a>`;
    },
    async findMentions(event) {
      event.preventDefault();
      this.sent = false;
      this.loading = true;
      this.hasResult = false;
      this.error = null;
      this.mentions = [];
      const res = await fetch(
        `${API}/check/?url=${encodeURIComponent(this.url)}`
      );

      if (res.status === 200) {
        const json = await res.json();
        if (json.error) {
          this.error = this.errorText(json.message, res.status);
        } else {
          this.mentions = json.urls;
          this.hasResult = true;
        }
        this.loading = false;
      } else {
        this.loading = false;
        try {
          const json = await res.json();
          this.error = json.message;
        } catch (e) {
          console.log(e);

          this.error = this.errorText(e.message, res.status);
        }
      }
    }
  }
};
</script>
