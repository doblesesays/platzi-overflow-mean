import { Observable } from 'rxjs/Observable';
import { User } from './user.model';
import {Injectable} from '@angular/core';
import * as urljoin from 'url-join';
import { environment } from '../../environments/environment';
import { Headers, Http, Response } from '@angular/http';
import { map } from 'rxjs/operator/map';
import { Router } from "@angular/router";
import { MatSnackBar } from '@angular/material';

@Injectable()
export class AuthService {
    currentUser?: User;
    usersUrl: string;

    constructor(
        private http: Http,
        private router: Router,
        public snackbar: MatSnackBar,
    ) {
        this.usersUrl = urljoin(environment.apiUrl, 'auth');
        if (this.isLoggedIn()) {
            const { userId, email, firstName, lastName } = JSON.parse(localStorage.getItem('user'));
            this.currentUser = new User(email, null, firstName, lastName, userId);
        }
    }

    signup(user: User) {
        const body = JSON.stringify(user);
        const headers = new Headers( {'Content-Type': 'application/json'} );
        return this.http.post(urljoin(this.usersUrl, 'signup'), body, {headers})
            .map((response: Response) => {
                const json = response.json();
                this.login(json);
                return json;
            })
            .catch((error: Response) => {
                console.log(error);
                return Observable.throw(error.json());
            })
    }

    signin(user:User) {
        const body = JSON.stringify(user);
        const headers = new Headers( {'Content-Type': 'application/json'} );
        return this.http.post(urljoin(this.usersUrl, 'signin'), body, {headers})
            .map((response: Response) => {
                const json = response.json();
                this.login(json);
                return json;
            })
            .catch((error: Response) => {
                console.log(error);
                return Observable.throw(error.json());
            });
    }

    login = ({token, userId, firstName, lastName, email}) => {
        this.currentUser = new User(email, null, firstName, lastName, userId);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ userId, firstName, lastName, email }));
        this.router.navigateByUrl('/');
    }

    isLoggedIn () {
        return localStorage.getItem('token') !== null;
    }

    logout () {
        localStorage.clear();
        this.currentUser = null;
        this.router.navigateByUrl('/signin');
    }

    showError(message) {
        this.snackbar.open(message, 'x', {duration: 2500});
    }

    public handleError = (error: any) => {
        const { error: {name}, message } = error;
        if (name === 'TokenExpiredError') {
            this.showError('Tu sesión ha expirado');
        } else if (name === 'JsonWebTokenError') {
            this.showError('Ha habido un problema con tu sesión');
        } else {
            this.showError(message || 'Ha ocurrido un error. Inténtalo nuevamente');
        }
        this.logout();
    }
}